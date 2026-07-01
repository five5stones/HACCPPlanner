/**
 * Read-only HACCP plan viewer (share links).
 */
const ViewApp = {
  doc: null,
  businessName: '',
  previewTab: 'haccp',

  getDocId() {
    return new URLSearchParams(window.location.search).get('doc')?.trim() || '';
  },

  async load() {
    const id = this.getDocId();
    if (!id) throw new Error('No plan specified in this link.');

    const data = await this.fetchDocument(id);
    const doc = data.document;
    if (!doc?.processSteps) throw new Error('Invalid plan data.');

    HaccpStore.library = {
      activeDocId: id,
      documents: { [id]: doc },
      settings: data.settings || { businessName: '' },
    };
    HaccpStore.migrateDocument(doc);

    this.doc = doc;
    this.businessName = (data.settings?.businessName || '').trim();
    return doc;
  },

  async fetchDocument(id) {
    const docRes = await fetch(`/api/documents/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (docRes.ok) return docRes.json();

    if (docRes.status !== 404) {
      throw new Error('Could not load this plan. Please try again later.');
    }

    const libRes = await fetch('/api/library', { cache: 'no-store' });
    if (!libRes.ok) {
      throw new Error('Could not reach the HACCP server. Make sure python3 server.py is running.');
    }

    const library = await libRes.json();
    const doc = library.documents?.[id];
    if (!doc) throw new Error('This HACCP plan could not be found.');

    return {
      document: doc,
      settings: library.settings || { businessName: '' },
    };
  },

  renderAll() {
    const d = this.doc;
    if (!d) return;

    document.title = d.title ? `${d.title} — View` : 'HACCP Plan — View';
    document.getElementById('view-header-name').textContent = d.title || 'HACCP Plan';

    HaccpRender.renderDocumentHeader(d, {
      titleEl: document.getElementById('document-title'),
      versionEl: document.getElementById('document-version-print'),
    });

    HaccpRender.renderTable(d, document.getElementById('haccp-tbody'), document.getElementById('preview-count'), {
      emptyMessage: 'This plan has no process steps yet.',
    });

    HaccpRender.renderFooter(d, this.businessName, {
      footnoteEl: document.getElementById('document-footnote'),
      businessEl: document.getElementById('document-business-name'),
    });

    this.renderFlowchart();
  },

  renderFlowchart() {
    const d = this.doc;
    const fc = normalizeFlowChart(d.flowChart);
    const fcTitle = fc.title || `${d.title} Flow Chart`;

    document.getElementById('flowchart-doc-title').textContent = fcTitle;
    document.getElementById('flowchart-doc-version').textContent =
      document.getElementById('document-version-print').textContent;
    document.getElementById('flowchart-business-name').textContent = this.businessName;

    FlowchartRenderer.render(document.getElementById('flowchart-preview'), fc, d.title, { compact: false });
  },

  setPreviewTab(tab) {
    this.previewTab = tab;
    document.querySelectorAll('.preview-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preview === tab);
    });
    document.getElementById('haccp-document').classList.toggle('preview-doc-active', tab === 'haccp');
    document.getElementById('flowchart-document').classList.toggle('preview-doc-active', tab === 'flowchart');
    if (tab === 'flowchart') this.renderFlowchart();
  },

  showState(state) {
    document.getElementById('view-loading').classList.toggle('hidden', state !== 'loading');
    document.getElementById('view-error').classList.toggle('hidden', state !== 'error');
    document.getElementById('view-app').classList.toggle('hidden', state !== 'ready');
  },

  preparePrint() {
    if (this.previewTab === 'flowchart') {
      this.renderFlowchart();
    }
    const inactiveId = this.previewTab === 'flowchart' ? 'haccp-document' : 'flowchart-document';
    const node = document.getElementById(inactiveId);
    if (node?.parentNode) {
      this._printDetached = { node, parent: node.parentNode, next: node.nextSibling };
      node.parentNode.removeChild(node);
    }
  },

  finishPrint() {
    if (this._printDetached) {
      const { node, parent, next } = this._printDetached;
      parent.insertBefore(node, next);
      this._printDetached = null;
    }
  },
};

document.querySelectorAll('.preview-tab').forEach((btn) => {
  btn.addEventListener('click', () => ViewApp.setPreviewTab(btn.dataset.preview));
});

document.getElementById('btn-view-print').addEventListener('click', () => {
  ViewApp.preparePrint();
  requestAnimationFrame(() => window.print());
});

window.addEventListener('beforeprint', () => ViewApp.preparePrint());
window.addEventListener('afterprint', () => ViewApp.finishPrint());

(async function initView() {
  ViewApp.showState('loading');
  try {
    await ViewApp.load();
    ViewApp.renderAll();
    ViewApp.showState('ready');
  } catch (err) {
    document.getElementById('view-error-message').textContent = err.message || 'Could not load this plan.';
    ViewApp.showState('error');
  }
})();
