/**
 * Shared HACCP table and document preview rendering.
 */
const HaccpRender = {
  escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text ?? '';
    return el.innerHTML;
  },

  nl2br(text) {
    return this.escapeHtml(text).replace(/\n/g, '<br>');
  },

  formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  },

  formatStepNo(no, isCcp) {
    if (no === '' || no == null) return '';
    return isCcp ? `${no} (CCP)` : String(no);
  },

  formatNoColumn(step) {
    if (step.isReferenceStep) return 'Ref. step';
    return this.formatStepNo(step.stepNo, step.isCcp);
  },

  hazardCount(steps) {
    return (steps || []).reduce((n, s) => n + (s.hazards?.length || 0), 0);
  },

  hazardTexts(step) {
    return (step.hazards || []).map((h) => h.text || h.hazard || '');
  },

  appendCell(tr, className, text) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.innerHTML = this.nl2br(text || '');
    tr.appendChild(td);
  },

  appendColumnCell(tr, entries) {
    const values = (entries || []).filter((v) => v !== undefined && v !== null);
    const display = values.length ? values : [''];

    if (display.length === 1) {
      this.appendCell(tr, 'cell-data', display[0]);
      return;
    }

    const td = document.createElement('td');
    td.className = 'cell-stacked';
    display.forEach((text) => {
      const div = document.createElement('div');
      div.className = 'stack-item';
      div.innerHTML = this.nl2br(text);
      td.appendChild(div);
    });
    tr.appendChild(td);
  },

  renderTable(documentData, tbodyEl, countEl, { emptyMessage = 'Your HACCP table will appear here.' } = {}) {
    const steps = documentData.processSteps || [];
    const total = this.hazardCount(steps);

    if (countEl) {
      countEl.textContent = `${steps.length} process step${steps.length !== 1 ? 's' : ''} · ${total} hazard${total !== 1 ? 's' : ''}`;
    }

    if (!steps.length || !total) {
      tbodyEl.innerHTML = `<tr class="empty-row"><td colspan="9">${emptyMessage}</td></tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    tbodyEl.innerHTML = '';

    steps.forEach((step) => {
      if (!step.hazards?.length) return;

      const tr = document.createElement('tr');
      tr.className = step.isReferenceStep ? 'step-group ref-step-group' : 'step-group';

      this.appendCell(tr, 'cell-ccp', this.formatNoColumn(step));
      this.appendCell(tr, 'cell-step', step.name);
      this.appendColumnCell(tr, this.hazardTexts(step));
      this.appendColumnCell(tr, step.controlMeasures);
      this.appendColumnCell(tr, step.criticalLimits);
      this.appendColumnCell(tr, step.monitoringProcedures);
      this.appendColumnCell(tr, step.frequencies);
      this.appendColumnCell(tr, step.correctiveActions);
      this.appendColumnCell(tr, step.records);

      fragment.appendChild(tr);
    });

    tbodyEl.appendChild(fragment);
  },

  renderDocumentHeader(documentData, { titleEl, versionEl }) {
    if (titleEl) titleEl.textContent = documentData.title || 'HACCP Plan';
    if (versionEl) {
      versionEl.textContent = `Version ${documentData.version} · ${this.formatDate(documentData.lastModified)}`;
    }
  },

  renderFooter(documentData, businessName, { footnoteEl, businessEl }) {
    if (footnoteEl) footnoteEl.textContent = documentData.footnote || '';
    if (businessEl) businessEl.textContent = businessName || '';
  },
};
