const DEFAULT_PAGE_TITLE = 'HACCP Plan Manager';

function appTitleText() {
  const businessName = HaccpStore.getBusinessName();
  return businessName ? `${businessName} HACCP Plan Manager` : DEFAULT_PAGE_TITLE;
}

function updatePageTitle() {
  const title = appTitleText();
  document.title = title;
  const appTitle = document.getElementById('app-title');
  if (appTitle) appTitle.textContent = title;
}

const COLUMN_STEPS = [
  { wizard: 3, key: 'controlMeasures', title: 'Control measures', nextLabel: 'critical limits' },
  { wizard: 4, key: 'criticalLimits', title: 'Critical limits', nextLabel: 'monitoring procedures' },
  { wizard: 5, key: 'monitoringProcedures', title: 'Monitoring procedures', nextLabel: 'frequency' },
  { wizard: 6, key: 'frequencies', title: 'Frequency', nextLabel: 'corrective actions' },
  { wizard: 7, key: 'correctiveActions', title: 'Corrective actions', nextLabel: 'records' },
  { wizard: 8, key: 'records', title: 'Records', nextLabel: 'review' },
];

const WIZARD_LABELS = [
  'Process step',
  'Hazards',
  'Controls',
  'Limits',
  'Monitoring',
  'Frequency',
  'Corrective',
  'Records',
];

const ui = {
  currentStepId: null,
  wizardStep: 1,
  wizardReturnToReview: false,
  editingStepId: null,
  renamingDocId: null,
  view: 'dashboard',
  previewTab: 'haccp',
};

const panels = {
  1: document.getElementById('panel-step-1'),
  2: document.getElementById('panel-step-2'),
  column: document.getElementById('panel-column'),
  review: document.getElementById('panel-review'),
  flowchart: document.getElementById('panel-flowchart'),
};

function doc() {
  return HaccpStore.getActiveDocument();
}

function uid() {
  return crypto.randomUUID();
}

function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text ?? '';
  return el.innerHTML;
}

function nl2br(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function formatStepNo(no, isCcp) {
  if (no === '' || no == null) return '';
  return isCcp ? `${no} (CCP)` : String(no);
}

function syncRefStepFieldsVisibility() {
  const isRef = document.getElementById('process-step-is-ref')?.checked;
  document.getElementById('process-step-flow-fields')?.classList.toggle('hidden', Boolean(isRef));
  const title = document.getElementById('panel-step-1-title');
  const hint = document.getElementById('panel-step-1-hint');
  const nameLabel = document.getElementById('process-step-name-label');
  const nameInput = document.getElementById('process-step-name');
  if (title) title.textContent = isRef ? '1. Reference step' : '1. Process step';
  if (hint) {
    hint.textContent = isRef
      ? 'Add a table-only reference row (e.g. Listeria controls). Not included on the flow chart.'
      : 'Name this stage in your production flow.';
  }
  if (nameLabel) {
    nameLabel.innerHTML = isRef
      ? 'Reference title <span class="required">*</span>'
      : 'Process step <span class="required">*</span>';
  }
  if (nameInput) {
    nameInput.placeholder = isRef ? 'e.g. Listeria' : 'e.g. Receipt of Raw Materials';
  }
}

function syncEditRefStepFieldsVisibility() {
  const isRef = document.getElementById('edit-step-is-ref')?.checked;
  document.getElementById('edit-step-flow-fields')?.classList.toggle('hidden', Boolean(isRef));
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getStep(id) {
  return doc().processSteps.find((s) => s.id === id);
}

function hazardCount(steps) {
  return steps.reduce((n, s) => n + (s.hazards?.length || 0), 0);
}

function hazardTexts(step) {
  return (step.hazards || []).map((h) => h.text || h.hazard || '');
}

function persist(bump = true) {
  HaccpStore.save(bump);
  if (ui.view === 'builder') renderAll();
  else renderDashboard();
}

function showWizard(step) {
  ui.wizardStep = step;

  document.querySelectorAll('.step-dot').forEach((dot) => {
    const n = Number(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (n === step) dot.classList.add('active');
    else if (n < step) dot.classList.add('done');
  });

  if (ui.previewTab === 'flowchart') {
    panels.flowchart.classList.add('active');
    return;
  }

  panels.flowchart.classList.remove('active');
  panels[1].classList.toggle('active', step === 1);
  panels[2].classList.toggle('active', step === 2);
  panels.column.classList.toggle('active', step >= 3 && step <= 8);
  panels.review.classList.toggle('active', step === 9);

  if (step >= 3 && step <= 8) renderColumnPanel(step);
  if (step === 2) renderHazardsPanel();
  syncWizardReturnButtons();
}

function syncWizardReturnButtons() {
  const show = ui.wizardReturnToReview;
  document.getElementById('btn-save-hazards-finish')?.classList.toggle('hidden', !show);
  document.getElementById('btn-save-column-finish')?.classList.toggle('hidden', !show || ui.wizardStep === 8);
}

function applyBuilderMode() {
  const isFlowchart = ui.previewTab === 'flowchart';
  const indicator = document.getElementById('step-indicator');
  const builderPanel = document.querySelector('.builder-panel');

  indicator.classList.toggle('hidden', isFlowchart);
  builderPanel.classList.toggle('builder-panel--flowchart', isFlowchart);
  document.getElementById('preview-count').classList.toggle('hidden', isFlowchart);

  document.getElementById('header-subtitle').textContent = isFlowchart
    ? 'Edit your production flow chart'
    : 'Build each process step in 8 stages';

  if (isFlowchart) {
    panels[1].classList.remove('active');
    panels[2].classList.remove('active');
    panels.column.classList.remove('active');
    panels.review.classList.remove('active');
    panels.flowchart.classList.add('active');
    renderFlowchartEditor();
  } else {
    showWizard(ui.wizardStep);
  }
}

function renderStepIndicator() {
  const nav = document.getElementById('step-indicator');
  nav.innerHTML = WIZARD_LABELS.map(
    (label, i) => {
      const n = i + 1;
      const line = i < WIZARD_LABELS.length - 1 ? '<div class="step-line"></div>' : '';
      return `<div class="step-dot" data-step="${n}"><span>${n}</span> ${label}</div>${line}`;
    }
  ).join('') + '<div class="step-line"></div><div class="step-dot" data-step="9"><span>✓</span> Review</div>';
}

function updateStepLabels() {
  const step = getStep(ui.currentStepId);
  const name = step?.name || '—';
  document.getElementById('wizard-step-label').textContent = name;
  document.getElementById('column-step-label').textContent = name;
  const count = step?.hazards?.length || 0;
  document.getElementById('column-hazard-count').textContent =
    `${count} hazard${count !== 1 ? 's' : ''}`;
}

function renderEntryList(containerId, values, placeholder) {
  const container = document.getElementById(containerId);
  const items = values.length ? values : [''];
  container.innerHTML = items
    .map(
      (val, i) => `
    <div class="entry-item" data-index="${i}">
      <label class="entry-item-label">Entry ${i + 1}</label>
      <textarea class="entry-textarea" rows="${containerId === 'hazards-list' ? 2 : 3}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(val)}</textarea>
      ${items.length > 1 ? `<button type="button" class="btn btn-danger btn-icon entry-remove" data-index="${i}">Remove</button>` : ''}
    </div>`
    )
    .join('');

  container.querySelectorAll('.entry-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      const current = collectEntries(containerId);
      current.splice(idx, 1);
      renderEntryList(containerId, current.length ? current : [''], placeholder);
    });
  });
}

function collectEntries(containerId) {
  return [...document.querySelectorAll(`#${containerId} .entry-textarea`)]
    .map((el) => el.value.trim())
    .filter(Boolean);
}

function collectAllEntries(containerId) {
  return [...document.querySelectorAll(`#${containerId} .entry-textarea`)].map((el) => el.value.trim());
}

function renderHazardsPanel() {
  updateStepLabels();
  const step = getStep(ui.currentStepId);
  renderEntryList('hazards-list', hazardTexts(step), 'Describe the hazard…');
}

function getColumnConfig(wizardStep) {
  return COLUMN_STEPS.find((c) => c.wizard === wizardStep);
}

function renderColumnPanel(wizardStep) {
  updateStepLabels();
  const config = getColumnConfig(wizardStep);
  if (!config) return;

  const step = getStep(ui.currentStepId);
  const entries = step?.[config.key] || [];

  document.getElementById('column-panel-title').textContent = `${wizardStep}. ${config.title}`;
  document.getElementById('column-panel-hint').textContent =
    `Add one entry to apply across all ${step?.hazards?.length || 0} hazard(s), or add multiple entries to split into separate rows in the table.`;

  const nextBtn = document.getElementById('btn-save-column');
  if (ui.wizardReturnToReview && wizardStep === 8) {
    nextBtn.textContent = 'Save and return to review';
  } else {
    nextBtn.textContent =
      wizardStep === 8 ? 'Finish process step →' : `Continue to ${config.nextLabel} →`;
  }

  renderEntryList('column-entries-list', entries, `Enter ${config.title.toLowerCase()}…`);
}

function showView(view) {
  ui.view = view;
  document.getElementById('view-dashboard').classList.toggle('view-active', view === 'dashboard');
  document.getElementById('view-builder').classList.toggle('view-active', view === 'builder');
}

function openDocument(id) {
  if (!HaccpStore.openDocument(id)) return;
  ui.currentStepId = null;
  ui.previewTab = 'haccp';
  showView('builder');
  const d = doc();
  renderAll();
  applyBuilderMode();
  showWizard(d?.processSteps?.length ? 9 : 1);
}

function goToDashboard() {
  HaccpStore.goToDashboard();
  ui.currentStepId = null;
  renderDashboard();
  showView('dashboard');
}

function closeAllCardMenus() {
  document.querySelectorAll('.card-menu').forEach((menu) => menu.classList.add('hidden'));
  document.querySelectorAll('.card-menu-trigger').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
}

function renderDashboard() {
  closeAllCardMenus();
  const docs = HaccpStore.getAllDocuments();
  const grid = document.getElementById('dashboard-grid');
  const empty = document.getElementById('dashboard-empty');

  empty.classList.toggle('hidden', docs.length > 0);

  grid.innerHTML = docs
    .map(
      (d) => `
    <article class="dashboard-card ${d.isEmpty ? 'dashboard-card-empty' : ''}">
      <div class="dashboard-card-body">
        <h3 class="dashboard-card-title">${escapeHtml(d.title)}</h3>
        <dl class="dashboard-card-stats">
          <div><dt>Version</dt><dd>v${d.version}</dd></div>
          <div><dt>Process steps</dt><dd>${d.stepCount}</dd></div>
          <div><dt>Hazards</dt><dd>${d.hazardCount}</dd></div>
        </dl>
        <p class="dashboard-card-date">${d.lastModified ? `Updated ${formatDate(d.lastModified)}` : 'Not yet edited'}</p>
        ${d.isEmpty ? '<span class="dashboard-card-badge">Empty plan</span>' : ''}
      </div>
      <div class="dashboard-card-actions">
        <button type="button" class="btn btn-primary" data-open-doc="${d.id}">${d.isEmpty ? 'Start building' : 'Open plan'}</button>
        <button type="button" class="btn btn-ghost btn-icon" data-share-doc="${d.id}">View link</button>
        <div class="card-menu-wrap">
          <button type="button" class="btn btn-ghost btn-icon card-menu-trigger" aria-label="More actions" aria-haspopup="menu" aria-expanded="false" data-card-menu="${d.id}">&#8942;</button>
          <div class="card-menu hidden" role="menu">
            <button type="button" role="menuitem" data-duplicate-doc="${d.id}">Duplicate</button>
            <button type="button" role="menuitem" data-rename-doc="${d.id}">Rename</button>
            <button type="button" role="menuitem" class="card-menu-danger" data-delete-doc="${d.id}">Delete</button>
          </div>
        </div>
      </div>
    </article>`
    )
    .join('');

  grid.querySelectorAll('[data-open-doc]').forEach((btn) => {
    btn.addEventListener('click', () => openDocument(btn.dataset.openDoc));
  });

  grid.querySelectorAll('[data-share-doc]').forEach((btn) => {
    btn.addEventListener('click', () => openShareDialog(btn.dataset.shareDoc));
  });

  grid.querySelectorAll('[data-card-menu]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.closest('.card-menu-wrap')?.querySelector('.card-menu');
      if (!menu) return;
      const isOpen = !menu.classList.contains('hidden');
      closeAllCardMenus();
      if (!isOpen) {
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  grid.querySelectorAll('.card-menu-wrap').forEach((wrap) => {
    wrap.addEventListener('click', (e) => e.stopPropagation());
  });

  grid.querySelectorAll('[data-duplicate-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllCardMenus();
      const id = HaccpStore.duplicateDocument(btn.dataset.duplicateDoc);
      if (id) openDocument(id);
    });
  });

  grid.querySelectorAll('[data-rename-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllCardMenus();
      ui.renamingDocId = btn.dataset.renameDoc;
      const current = HaccpStore.library.documents[ui.renamingDocId];
      document.getElementById('rename-doc-title').value = current?.title || '';
      document.getElementById('dialog-rename-doc').showModal();
    });
  });

  grid.querySelectorAll('[data-delete-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllCardMenus();
      const id = btn.dataset.deleteDoc;
      const title = HaccpStore.library.documents[id]?.title || 'this plan';
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      HaccpStore.deleteDocument(id);
      renderDashboard();
    });
  });
}

function renderLibrary() {
  /* dashboard replaces inline library bar */
}

function renderHeader() {
  const d = doc();
  document.getElementById('header-title').value = d.title;
  document.getElementById('header-subtitle').textContent = 'Build each process step in 8 stages';
  document.getElementById('version-badge').textContent = `Version ${d.version}`;
  document.getElementById('last-modified').textContent = d.lastModified
    ? `Last edited ${formatDate(d.lastModified)}`
    : '';
  HaccpRender.renderDocumentHeader(d, {
    titleEl: document.getElementById('document-title'),
    versionEl: document.getElementById('document-version-print'),
  });
  document.getElementById('btn-reset-sample').classList.toggle('hidden', d._sampleKey !== 'sandwich');
}

function saveDocumentTitle(title, { bump = false, skipPersist = false } = {}) {
  const d = doc();
  if (!d) return false;
  const trimmed = (title || '').trim();
  if (!trimmed || trimmed === d.title) return false;
  d.title = trimmed;
  document.getElementById('doc-title').value = trimmed;
  document.getElementById('header-title').value = trimmed;
  document.getElementById('document-title').textContent = trimmed;
  if (!skipPersist) persist(bump);
  return true;
}

function renderTable() {
  HaccpRender.renderTable(doc(), document.getElementById('haccp-tbody'), document.getElementById('preview-count'));
}

function renderStepsList() {
  const list = document.getElementById('steps-list');
  const empty = document.getElementById('steps-empty');
  const steps = doc().processSteps;
  empty.classList.toggle('hidden', steps.length > 0);
  list.innerHTML = steps
    .map(
      (s) => `
    <li>
      <span><strong>${escapeHtml(s.name)}</strong>${s.isReferenceStep ? ' <span class="ref-step-badge">Ref. step</span>' : `<span class="step-meta"> · ${s.hazards?.length || 0} hazard(s)</span>`}</span>
      <button type="button" class="btn btn-ghost btn-icon" data-edit-wizard="${s.id}">Edit</button>
    </li>`
    )
    .join('');

  list.querySelectorAll('[data-edit-wizard]').forEach((btn) => {
    btn.addEventListener('click', () => startEditStep(btn.dataset.editWizard, 2));
  });
}

function selectDocumentTheme(themeId) {
  const d = doc();
  if (!d) return;
  const next = normalizeThemeId(themeId);
  if (d.theme === next) return;
  d.theme = next;
  applyDocumentTheme(d);
  syncThemePicker(next);
  persist(false);
}

function ensureThemePicker() {
  const container = document.getElementById('theme-picker');
  if (!container) return;
  if (container.dataset.ready) return;
  container.dataset.ready = '1';
  renderThemePicker(container, doc()?.theme, selectDocumentTheme);
}

function renderReview() {
  const review = document.getElementById('review-list');
  const d = doc();
  document.getElementById('doc-title').value = d.title;
  document.getElementById('doc-footnote').value = d.footnote || '';
  ensureThemePicker();
  syncThemePicker(d.theme);

  if (!d.processSteps.length) {
    review.innerHTML = '<p class="empty-hint">No process steps yet.</p>';
    return;
  }

  review.innerHTML = d.processSteps
    .map((step) => {
      const col = (label, arr, wizardStep) =>
        `<p class="review-col-row"><span><strong>${label}</strong>${escapeHtml((arr || []).join(' · ') || '—')}</span><button type="button" class="btn btn-ghost btn-icon review-col-edit" data-edit-wizard-step="${wizardStep}" data-step-id="${step.id}">Edit</button></p>`;

      return `
      <div class="review-step review-step--collapsed">
        <div class="review-step-header">
          <button type="button" class="review-step-toggle" aria-expanded="false" aria-label="Show step details">
            <span class="review-step-chevron" aria-hidden="true"></span>
          </button>
          <span class="review-step-title">${step.isReferenceStep ? '<span class="ref-step-badge">Ref. step</span> ' : ''}${escapeHtml(step.name)}${!step.isReferenceStep && step.stepNo ? ` <span class="step-meta">${escapeHtml(formatStepNo(step.stepNo, step.isCcp))}</span>` : ''}</span>
          <span class="review-step-actions">
            <button type="button" class="btn btn-ghost btn-icon" data-edit-step-meta="${step.id}">Edit details</button>
            <button type="button" class="btn btn-danger btn-icon" data-delete-step="${step.id}">Delete</button>
          </span>
        </div>
        <div class="review-hazard">
          <div class="review-hazard-grid">
            <p class="review-col-row"><span><strong>Hazards</strong>${escapeHtml(hazardTexts(step).join(' · ') || '—')}</span><button type="button" class="btn btn-ghost btn-icon review-col-edit" data-edit-wizard-step="2" data-step-id="${step.id}">Edit</button></p>
            ${col('Control measures', step.controlMeasures, 3)}
            ${col('Critical limits', step.criticalLimits, 4)}
            ${col('Monitoring', step.monitoringProcedures, 5)}
            ${col('Frequency', step.frequencies, 6)}
            ${col('Corrective actions', step.correctiveActions, 7)}
            ${col('Records', step.records, 8)}
          </div>
        </div>
      </div>`;
    })
    .join('');

  review.querySelectorAll('[data-edit-step-meta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = getStep(btn.dataset.editStepMeta);
      if (!step) return;
      ui.editingStepId = step.id;
      document.getElementById('edit-step-name').value = step.name;
      document.getElementById('edit-step-is-ref').checked = Boolean(step.isReferenceStep);
      document.getElementById('edit-step-no').value = step.stepNo || '';
      document.getElementById('edit-step-is-ccp').checked = Boolean(step.isCcp);
      syncEditRefStepFieldsVisibility();
      document.getElementById('dialog-edit-step').showModal();
    });
  });

  review.querySelectorAll('[data-edit-wizard-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      startEditStep(btn.dataset.stepId, Number(btn.dataset.editWizardStep));
    });
  });

  review.querySelectorAll('[data-delete-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = getStep(btn.dataset.deleteStep);
      const label = step?.isReferenceStep ? 'reference step' : 'process step';
      if (!confirm(`Delete this ${label}?`)) return;
      doc().processSteps = doc().processSteps.filter((s) => s.id !== btn.dataset.deleteStep);
      autoSyncFlowChart();
      persist(true);
    });
  });
}

function renderDocumentFooter() {
  HaccpRender.renderFooter(doc(), HaccpStore.getBusinessName(), {
    footnoteEl: document.getElementById('document-footnote'),
    businessEl: document.getElementById('document-business-name'),
  });
  document.getElementById('flowchart-business-name').textContent = HaccpStore.getBusinessName();
}

function getViewLinkUrl(docId) {
  const url = new URL('view.html', window.location.href);
  url.searchParams.set('doc', docId);
  return url.href;
}

function openShareDialog(docId) {
  const id = docId || doc()?.id;
  if (!id) return;
  const link = getViewLinkUrl(id);
  document.getElementById('share-link-url').value = link;
  document.getElementById('btn-open-share-link').href = link;
  document.getElementById('dialog-share-link').showModal();
}

async function copyShareLink() {
  const input = document.getElementById('share-link-url');
  const link = input.value;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  const btn = document.getElementById('btn-copy-share-link');
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => {
    btn.textContent = original;
  }, 1500);
}

function openAdminDialog() {
  document.getElementById('admin-business-name').value = HaccpStore.getBusinessName();
  document.getElementById('admin-save-hint').classList.add('hidden');
  document.getElementById('dialog-admin-settings').showModal();
}

function saveAdminSettings() {
  const name = document.getElementById('admin-business-name').value.trim();
  HaccpStore.setBusinessName(name);
  updatePageTitle();
  if (ui.view === 'builder') renderDocumentFooter();
  const hint = document.getElementById('admin-save-hint');
  hint.classList.remove('hidden');
  setTimeout(() => {
    if (document.getElementById('dialog-admin-settings').open) {
      document.getElementById('dialog-admin-settings').close();
    }
  }, 600);
}

function renderFlowchart(compact = false) {
  const d = doc();
  const fc = normalizeFlowChart(d.flowChart);
  const fcTitle = fc.title || `${d.title} Flow Chart`;
  document.getElementById('flowchart-doc-title').textContent = fcTitle;
  document.getElementById('flowchart-doc-version').textContent =
    document.getElementById('document-version-print').textContent;
  FlowchartRenderer.render(document.getElementById('flowchart-preview'), fc, d.title, { compact });
  document.getElementById('flowchart-document').classList.toggle('flowchart-document--print', compact);
}

function renderFlowchartEditor() {
  const d = doc();
  const fc = normalizeFlowChart(d.flowChart);
  document.getElementById('flowchart-title').value = fc.title || '';

  const editor = document.getElementById('flowchart-editor');
  if (!fc.stages.length) {
    editor.innerHTML = '<p class="empty-hint">No flow chart steps yet. Add a step or generate from your HACCP plan.</p>';
    return;
  }

  editor.innerHTML = fc.stages
    .map(
      (stage, si) => `
    <div class="fc-edit-stage" data-stage-index="${si}">
      <div class="fc-edit-stage-header">
        <input type="text" class="fc-edit-stage-label" value="${escapeHtml(stage.label)}" placeholder="Step label">
        <button type="button" class="btn btn-danger btn-icon fc-remove-stage" data-stage-index="${si}">Remove step</button>
      </div>
      <div class="fc-edit-nodes">
        ${(stage.nodes || [])
          .map(
            (node, ni) => `
          <div class="fc-edit-node" data-stage-index="${si}" data-node-index="${ni}">
            <input type="text" class="fc-edit-node-text" value="${escapeHtml(node.text)}" placeholder="Process name">
            <button type="button" class="btn btn-ghost btn-icon fc-remove-node" data-stage-index="${si}" data-node-index="${ni}">×</button>
          </div>`
          )
          .join('')}
      </div>
      <button type="button" class="btn btn-ghost btn-icon fc-add-node" data-stage-index="${si}">+ Add parallel process</button>
    </div>`
    )
    .join('');

  editor.querySelectorAll('.fc-remove-stage').forEach((btn) => {
    btn.addEventListener('click', () => {
      fc.stages.splice(Number(btn.dataset.stageIndex), 1);
      d.flowChart = fc;
      renderFlowchartEditor();
      renderFlowchart();
    });
  });

  editor.querySelectorAll('.fc-remove-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      const si = Number(btn.dataset.stageIndex);
      fc.stages[si].nodes.splice(Number(btn.dataset.nodeIndex), 1);
      d.flowChart = fc;
      renderFlowchartEditor();
      renderFlowchart();
    });
  });

  editor.querySelectorAll('.fc-add-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      const si = Number(btn.dataset.stageIndex);
      fc.stages[si].nodes.push({ id: uid(), text: '' });
      d.flowChart = fc;
      renderFlowchartEditor();
    });
  });
}

function collectFlowchartFromEditor() {
  const d = doc();
  const stages = [...document.querySelectorAll('.fc-edit-stage')].map((stageEl, si) => {
    const oldStage = d.flowChart?.stages?.[si];
    return {
      id: oldStage?.id || uid(),
      label: stageEl.querySelector('.fc-edit-stage-label')?.value.trim() || `Step ${si + 1}`,
      nodes: [...stageEl.querySelectorAll('.fc-edit-node')].map((nodeEl, ni) => ({
        id: oldStage?.nodes?.[ni]?.id || uid(),
        text: nodeEl.querySelector('.fc-edit-node-text')?.value.trim() || '',
      })).filter((n) => n.text),
    };
  }).filter((s) => s.nodes.length);

  return {
    title: document.getElementById('flowchart-title').value.trim(),
    stages,
    manualEdit: true,
  };
}

function autoSyncFlowChart() {
  const d = doc();
  if (!d || d.flowChart?.manualEdit) return;
  d.flowChart = generateFlowChartFromHaccp(d);
}

function setPreviewTab(tab) {
  ui.previewTab = tab;
  document.querySelectorAll('.preview-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preview === tab);
  });
  document.getElementById('haccp-document').classList.toggle('preview-doc-active', tab === 'haccp');
  document.getElementById('flowchart-document').classList.toggle('preview-doc-active', tab === 'flowchart');
  applyBuilderMode();
  if (tab === 'flowchart') renderFlowchart();
}

function renderAll() {
  if (ui.view === 'dashboard') {
    renderDashboard();
    return;
  }
  applyDocumentTheme(doc());
  renderHeader();
  renderTable();
  renderStepsList();
  renderReview();
  renderDocumentFooter();
  renderFlowchart();
  renderFlowchartEditor();
  setPreviewTab(ui.previewTab || 'haccp');
}

function createEmptyStepFields() {
  return {
    controlMeasures: [],
    criticalLimits: [],
    monitoringProcedures: [],
    frequencies: [],
    correctiveActions: [],
    records: [],
  };
}

function startEditStep(stepId, wizardStep = 2) {
  ui.wizardReturnToReview = ui.wizardStep === 9;
  ui.currentStepId = stepId;
  if (ui.previewTab === 'flowchart') setPreviewTab('haccp');
  showWizard(wizardStep);
}

function finishCurrentProcessStep() {
  autoSyncFlowChart();
  persist(true);
  ui.currentStepId = null;
  ui.wizardReturnToReview = false;
  showWizard(9);
}

function saveCurrentWizardStepData() {
  const step = getStep(ui.currentStepId);
  if (!step) return false;

  if (ui.wizardStep === 2) {
    const texts = collectEntries('hazards-list');
    if (!texts.length) {
      alert('Add at least one hazard.');
      return false;
    }
    const existing = step.hazards || [];
    step.hazards = texts.map((text, i) => ({
      id: existing[i]?.id || uid(),
      text,
    }));
    return true;
  }

  if (ui.wizardStep >= 3 && ui.wizardStep <= 8) {
    const config = getColumnConfig(ui.wizardStep);
    if (!config) return false;
    step[config.key] = collectEntries('column-entries-list');
    return true;
  }

  return false;
}

function saveWizardStepAndReturnToReview() {
  if (!ui.wizardReturnToReview) return;
  if (!saveCurrentWizardStepData()) return;
  finishCurrentProcessStep();
}

function saveHazardsAndContinue() {
  if (!saveCurrentWizardStepData()) return;
  persist(false);
  showWizard(3);
}

function saveColumnAndContinue() {
  const step = getStep(ui.currentStepId);
  const config = getColumnConfig(ui.wizardStep);
  if (!step || !config) return;

  step[config.key] = collectEntries('column-entries-list');

  if (ui.wizardStep === 8) {
    finishCurrentProcessStep();
  } else {
    persist(false);
    showWizard(ui.wizardStep + 1);
  }
}

function startAddReferenceStep() {
  ui.currentStepId = null;
  if (ui.previewTab === 'flowchart') setPreviewTab('haccp');
  showWizard(1);
  document.getElementById('form-process-step').reset();
  document.getElementById('process-step-is-ref').checked = true;
  syncRefStepFieldsVisibility();
}

// Events
document.getElementById('process-step-is-ref').addEventListener('change', syncRefStepFieldsVisibility);
document.getElementById('edit-step-is-ref').addEventListener('change', syncEditRefStepFieldsVisibility);

document.getElementById('form-process-step').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('process-step-name').value.trim();
  const isReferenceStep = document.getElementById('process-step-is-ref').checked;
  const stepNo = document.getElementById('process-step-no').value;
  const isCcp = document.getElementById('process-step-is-ccp').checked;
  if (!name) return;

  const step = {
    id: uid(),
    name,
    stepNo: isReferenceStep ? '' : stepNo ? String(stepNo) : '',
    isCcp: isReferenceStep ? false : isCcp,
    isReferenceStep,
    hazards: [],
    ...createEmptyStepFields(),
  };
  doc().processSteps.push(step);
  ui.currentStepId = step.id;
  ui.wizardReturnToReview = false;
  e.target.reset();
  document.getElementById('process-step-is-ref').checked = false;
  syncRefStepFieldsVisibility();
  persist(false);
  showWizard(2);
});

document.getElementById('btn-add-hazard-entry').addEventListener('click', () => {
  const current = collectAllEntries('hazards-list');
  current.push('');
  renderEntryList('hazards-list', current, 'Describe the hazard…');
});

document.getElementById('btn-save-hazards').addEventListener('click', saveHazardsAndContinue);
document.getElementById('btn-save-hazards-finish').addEventListener('click', saveWizardStepAndReturnToReview);
document.getElementById('btn-back-wizard-1').addEventListener('click', () => showWizard(1));

document.getElementById('btn-add-column-entry').addEventListener('click', () => {
  const config = getColumnConfig(ui.wizardStep);
  if (!config) return;
  const current = collectAllEntries('column-entries-list');
  current.push('');
  renderEntryList('column-entries-list', current, `Enter ${config.title.toLowerCase()}…`);
});

document.getElementById('btn-save-column').addEventListener('click', saveColumnAndContinue);
document.getElementById('btn-save-column-finish').addEventListener('click', saveWizardStepAndReturnToReview);
document.getElementById('btn-back-column').addEventListener('click', () => {
  showWizard(ui.wizardStep === 3 ? 2 : ui.wizardStep - 1);
});

document.getElementById('btn-add-more').addEventListener('click', () => {
  ui.currentStepId = null;
  if (ui.previewTab === 'flowchart') setPreviewTab('haccp');
  showWizard(1);
  document.getElementById('form-process-step').reset();
  document.getElementById('process-step-is-ref').checked = false;
  syncRefStepFieldsVisibility();
});

document.getElementById('btn-add-ref-step').addEventListener('click', startAddReferenceStep);

document.getElementById('review-list').addEventListener('click', (e) => {
  if (e.target.closest('.review-step-actions, .review-col-edit')) return;
  const toggle = e.target.closest('.review-step-toggle, .review-step-title');
  if (!toggle) return;
  const stepEl = toggle.closest('.review-step');
  if (!stepEl) return;
  stepEl.classList.toggle('review-step--collapsed');
  const btn = stepEl.querySelector('.review-step-toggle');
  if (btn) btn.setAttribute('aria-expanded', stepEl.classList.contains('review-step--collapsed') ? 'false' : 'true');
});

document.querySelectorAll('.preview-tab').forEach((btn) => {
  btn.addEventListener('click', () => setPreviewTab(btn.dataset.preview));
});

document.getElementById('btn-add-flow-stage').addEventListener('click', () => {
  const d = doc();
  if (!d.flowChart) d.flowChart = createEmptyFlowChart();
  const fc = normalizeFlowChart(d.flowChart);
  const n = fc.stages.length + 1;
  fc.stages.push({
    id: uid(),
    label: `Step ${n === 1 ? 'One' : n === 2 ? 'Two' : n === 3 ? 'Three' : n === 4 ? 'Four' : n === 5 ? 'Five' : n === 6 ? 'Six' : n === 7 ? 'Seven' : n}`,
    nodes: [{ id: uid(), text: '' }],
  });
  d.flowChart = fc;
  renderFlowchartEditor();
  renderFlowchart();
});

document.getElementById('btn-save-flowchart').addEventListener('click', () => {
  doc().flowChart = collectFlowchartFromEditor();
  persist(true);
  setPreviewTab('flowchart');
});

document.getElementById('btn-generate-flow-from-haccp').addEventListener('click', () => {
  const d = doc();
  if (!d.processSteps.length) {
    alert('Add HACCP process steps first.');
    return;
  }
  d.flowChart = generateFlowChartFromHaccp(d, { force: true });
  d.flowChart.manualEdit = false;
  renderFlowchartEditor();
  renderFlowchart();
  persist(true);
  setPreviewTab('flowchart');
});

document.getElementById('header-title').addEventListener('change', (e) => {
  saveDocumentTitle(e.target.value);
});

document.getElementById('form-document-meta').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = doc();
  const newTitle = document.getElementById('doc-title').value.trim();
  const newFootnote = document.getElementById('doc-footnote').value.trim();
  let changed = false;
  if (saveDocumentTitle(newTitle, { skipPersist: true })) changed = true;
  if (newFootnote !== (d.footnote || '')) {
    d.footnote = newFootnote;
    changed = true;
  }
  if (changed) persist(false);
});

document.getElementById('form-edit-step').addEventListener('submit', (e) => {
  e.preventDefault();
  const step = getStep(ui.editingStepId);
  if (!step) return;
  step.name = document.getElementById('edit-step-name').value.trim();
  step.isReferenceStep = document.getElementById('edit-step-is-ref').checked;
  if (step.isReferenceStep) {
    step.stepNo = '';
    step.isCcp = false;
  } else {
    step.stepNo = document.getElementById('edit-step-no').value
      ? String(document.getElementById('edit-step-no').value)
      : '';
    step.isCcp = document.getElementById('edit-step-is-ccp').checked;
  }
  ui.editingStepId = null;
  document.getElementById('dialog-edit-step').close();
  autoSyncFlowChart();
  persist(true);
});

document.getElementById('btn-cancel-edit-step').addEventListener('click', () => {
  ui.editingStepId = null;
  document.getElementById('dialog-edit-step').close();
});

document.getElementById('btn-reset-sample').addEventListener('click', () => {
  if (!confirm('Reset the Sandwich HACCP to the PDF example?')) return;
  HaccpStore.resetSandwichToSample();
  renderAll();
  showWizard(9);
});

let printDetachedNodes = [];

function detachInactivePrintPreview() {
  if (printDetachedNodes.length) return;
  if (ui.view !== 'builder') return;

  const inactiveId = ui.previewTab === 'flowchart' ? 'haccp-document' : 'flowchart-document';
  const node = document.getElementById(inactiveId);
  if (!node?.parentNode) return;

  printDetachedNodes.push({
    node,
    parent: node.parentNode,
    next: node.nextSibling,
  });
  node.parentNode.removeChild(node);
}

function restoreDetachedPrintPreview() {
  printDetachedNodes.forEach(({ node, parent, next }) => {
    parent.insertBefore(node, next);
  });
  printDetachedNodes = [];
}

function preparePrint() {
  updatePageTitle();
  if (ui.view !== 'builder') return;
  if (ui.previewTab === 'flowchart') {
    renderFlowchart(true);
  }
  detachInactivePrintPreview();
}

function finishPrint() {
  restoreDetachedPrintPreview();
  if (ui.view === 'builder' && ui.previewTab === 'flowchart') {
    renderFlowchart(false);
  }
}

document.getElementById('btn-print').addEventListener('click', () => {
  preparePrint();
  if (ui.view === 'builder' && ui.previewTab === 'flowchart') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  } else {
    requestAnimationFrame(() => window.print());
  }
});

window.addEventListener('beforeprint', preparePrint);

window.addEventListener('afterprint', finishPrint);
document.getElementById('btn-export-json').addEventListener('click', () => {
  const d = doc();
  const blob = new Blob([HaccpStore.exportDocument(d.id)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${d.id}-haccp-v${d.version}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('btn-share-link').addEventListener('click', () => openShareDialog());
document.getElementById('btn-copy-share-link').addEventListener('click', copyShareLink);
document.getElementById('btn-close-share-link').addEventListener('click', () => {
  document.getElementById('dialog-share-link').close();
});

document.getElementById('btn-save-admin').addEventListener('click', saveAdminSettings);
document.getElementById('form-admin-settings').addEventListener('submit', (e) => {
  e.preventDefault();
  saveAdminSettings();
});

document.getElementById('btn-open-admin').addEventListener('click', openAdminDialog);
document.getElementById('btn-open-admin-builder').addEventListener('click', openAdminDialog);
document.getElementById('btn-cancel-admin').addEventListener('click', () => {
  document.getElementById('dialog-admin-settings').close();
});

document.getElementById('btn-back-dashboard').addEventListener('click', goToDashboard);

document.getElementById('btn-create-new').addEventListener('click', () => {
  document.getElementById('new-doc-title').value = '';
  document.getElementById('dialog-new-doc').showModal();
});

document.getElementById('btn-cancel-new-doc').addEventListener('click', () => {
  document.getElementById('dialog-new-doc').close();
});

document.getElementById('form-new-doc').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('new-doc-title').value.trim();
  const id = HaccpStore.createDocument(title);
  document.getElementById('dialog-new-doc').close();
  openDocument(id);
});

document.getElementById('form-rename-doc').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = ui.renamingDocId;
  const title = document.getElementById('rename-doc-title').value.trim();
  if (id && title) {
    HaccpStore.renameDocument(id, title);
    if (HaccpStore.library.activeDocId === id && ui.view === 'builder') {
      renderHeader();
    }
    renderDashboard();
  }
  ui.renamingDocId = null;
  document.getElementById('dialog-rename-doc').close();
});

document.getElementById('btn-cancel-rename-doc').addEventListener('click', () => {
  ui.renamingDocId = null;
  document.getElementById('dialog-rename-doc').close();
});

document.getElementById('btn-import-dashboard').addEventListener('click', () => {
  document.getElementById('import-file-dashboard').click();
});

document.getElementById('import-file-dashboard').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const id = HaccpStore.importDocument(null, data);
    if (!id) throw new Error('Invalid');
    renderDashboard();
    openDocument(id);
  } catch {
    alert('Could not import file.');
  }
  e.target.value = '';
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const id = HaccpStore.importDocument(doc()?.id, data);
    if (!id) throw new Error('Invalid');
    renderAll();
    showWizard(9);
  } catch {
    alert('Could not import file.');
  }
  e.target.value = '';
});

renderStepIndicator();

document.addEventListener('click', closeAllCardMenus);

async function initApp() {
  const dashboard = document.getElementById('view-dashboard');
  dashboard.classList.add('loading');
  try {
    await HaccpStore.load();
  } catch {
    alert('Could not load your HACCP plans. Please refresh the page.');
  } finally {
    dashboard.classList.remove('loading');
  }
  HaccpStore.goToDashboard();
  renderDashboard();
  showView('dashboard');
  updatePageTitle();
}

initApp();
