/**
 * Multi-document HACCP library with versioning.
 */

const STORAGE_KEY = 'haccp-library-v3';
const SETTINGS_KEY = 'haccp-settings-v1';
const API_LIBRARY = '/api/library';

const LEGACY_EMPTY_SLOT_IDS = ['document-2', 'document-3', 'document-4', 'document-5'];

function readSettingsBackup() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { businessName: '' };
    const data = JSON.parse(raw);
    return { businessName: typeof data.businessName === 'string' ? data.businessName : '' };
  } catch {
    return { businessName: '' };
  }
}

function writeSettingsBackup(settings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ businessName: (settings?.businessName || '').trim() })
  );
}

function resolveBusinessName(serverSettings) {
  const serverName = (serverSettings?.businessName || '').trim();
  if (serverName) return serverName;
  return readSettingsBackup().businessName.trim();
}

function cloneSample(sample) {
  return JSON.parse(JSON.stringify(sample));
}

function createEmptyDocument(id, title = 'New HACCP Plan') {
  return {
    id,
    title: (title || '').trim() || 'New HACCP Plan',
    version: 1,
    lastModified: new Date().toISOString(),
    processSteps: [],
    footnote: '',
    flowChart: createEmptyFlowChart(),
  };
}

function createSandwichSampleDocument() {
  const doc = cloneSample(SANDWICH_SAMPLE);
  doc.id = 'sandwich';
  doc._sampleKey = 'sandwich';
  doc._sampleVersion = 4;
  doc.lastModified = new Date().toISOString();
  doc.flowChart = generateFlowChartFromHaccp(doc, { force: true });
  return doc;
}

function buildDefaultLibrary() {
  const sandwich = createSandwichSampleDocument();
  return {
    activeDocId: null,
    documents: { [sandwich.id]: sandwich },
    settings: { businessName: '' },
  };
}

const HaccpStore = {
  library: buildDefaultLibrary(),
  saveStatus: 'idle',
  _saveTimer: null,
  _serverAvailable: null,

  setSaveStatus(status) {
    this.saveStatus = status;
    const el = document.getElementById('save-status');
    if (!el) return;
    el.dataset.status = status;
    el.textContent =
      status === 'saving'
        ? 'Saving…'
        : status === 'saved'
          ? 'Saved to server'
          : status === 'offline'
            ? 'Offline — saved locally'
            : status === 'error'
              ? 'Server save failed — saved locally'
              : '';
    el.classList.toggle('hidden', status === 'idle');
  },

  cacheLocally() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.library));
  },

  queueServerSave(immediate = false) {
    clearTimeout(this._saveTimer);
    if (immediate) {
      void this.syncToServer();
      return;
    }
    this._saveTimer = setTimeout(() => {
      void this.syncToServer();
    }, 400);
  },

  async syncToServer() {
    this.setSaveStatus('saving');
    try {
      const res = await fetch(API_LIBRARY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.library),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      this._serverAvailable = true;
      this.setSaveStatus('saved');
    } catch {
      this._serverAvailable = false;
      this.setSaveStatus(this.saveStatus === 'saving' ? 'offline' : 'error');
    }
  },

  applyLibrary(data) {
    if (!data?.documents) throw new Error('Invalid library');
    const serverName = (data.settings?.businessName || '').trim();
    const businessName = resolveBusinessName(data.settings);
    this.library = {
      activeDocId: data.activeDocId ?? null,
      documents: data.documents,
      settings: { businessName },
    };
    this.ensureLibrarySettings();
    this.migrateAllDocuments();
    writeSettingsBackup(this.library.settings);
    this.cacheLocally();
    if (!serverName && businessName) this.queueServerSave(true);
  },

  loadFromLocalStorage() {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('haccp-library-v2');
      if (raw) localStorage.removeItem('haccp-library-v2');
    }
    if (!raw) {
      this.migrateLegacyStorage();
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.library = buildDefaultLibrary();
        this.cacheLocally();
      }
      return;
    }
    const data = JSON.parse(raw);
    if (!data.documents) throw new Error('Invalid library');
    this.library = data;
    this.library.activeDocId = data.activeDocId ?? null;
    this.library.settings = data.settings ?? { businessName: '' };
    this.ensureLibrarySettings();
    this.migrateAllDocuments();
    writeSettingsBackup(this.library.settings);
    this.cacheLocally();
  },

  async load() {
    try {
      const res = await fetch(API_LIBRARY, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      this.applyLibrary(data);
      this._serverAvailable = true;
      if (Object.keys(this.library.documents).length === 0) {
        this.library = buildDefaultLibrary();
        this.migrateAllDocuments();
        this.cacheLocally();
      }
      await this.syncToServer();
      return;
    } catch {
      this._serverAvailable = false;
    }

    try {
      this.loadFromLocalStorage();
      await this.syncToServer();
    } catch {
      this.library = buildDefaultLibrary();
      this.cacheLocally();
      await this.syncToServer();
    }
  },

  migrateLegacyStorage() {
    const legacyKey = 'sandwich-haccp-plan-v1';
    try {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.processSteps)) return;

      const library = buildDefaultLibrary();
      library.documents.sandwich = {
        id: 'sandwich',
        title: 'Sandwich Production HACCP',
        version: 1,
        lastModified: new Date().toISOString(),
        processSteps: data.processSteps,
        footnote: data.footnote || '',
        flowChart: createEmptyFlowChart(),
      };
      this.migrateDocument(library.documents.sandwich);
      this.library = library;
      this.cacheLocally();
      this.queueServerSave(true);
      localStorage.removeItem(legacyKey);
    } catch {
      /* ignore */
    }
  },

  migrateLegacyEmptySlots() {
    LEGACY_EMPTY_SLOT_IDS.forEach((id) => {
      const slotDoc = this.library.documents[id];
      if (!slotDoc) return;
      const neverEdited =
        !(slotDoc.processSteps?.length) &&
        /^HACCP Document \d+$/.test(slotDoc.title || '');
      if (neverEdited) delete this.library.documents[id];
    });
    if (this.library.activeDocId && !this.library.documents[this.library.activeDocId]) {
      this.library.activeDocId = null;
    }
  },

  migrateAllDocuments() {
    this.ensureLibrarySettings();
    this.migrateLegacyEmptySlots();
    Object.values(this.library.documents).forEach((doc) => this.migrateDocument(doc));
  },

  ensureLibrarySettings() {
    if (!this.library.settings || typeof this.library.settings !== 'object') {
      this.library.settings = { businessName: '' };
    }
    if (typeof this.library.settings.businessName !== 'string') {
      this.library.settings.businessName = '';
    }
    if (!this.library.settings.businessName.trim()) {
      const backupName = readSettingsBackup().businessName.trim();
      if (backupName) this.library.settings.businessName = backupName;
    }
  },

  getBusinessName() {
    this.ensureLibrarySettings();
    return this.library.settings.businessName.trim();
  },

  setBusinessName(name) {
    this.ensureLibrarySettings();
    this.library.settings.businessName = (name || '').trim();
    writeSettingsBackup(this.library.settings);
    this.cacheLocally();
    this.queueServerSave(true);
  },

  migrateDocument(doc) {
    if (!doc?.processSteps) return;
    if (doc.id === 'sandwich' && !doc._sampleKey) doc._sampleKey = 'sandwich';
    this.ensureSandwichSampleFresh(doc);
    doc.processSteps.forEach((step) => {
      this.migrateNoFields(step);
      this.migrateStepStructure(step);
      if (step.isReferenceStep === undefined) step.isReferenceStep = false;
    });
    if (!doc.flowChart?.stages) {
      doc.flowChart = createEmptyFlowChart();
    }
    doc.flowChart = normalizeFlowChart(doc.flowChart);
    if (!doc.flowChart.manualEdit) {
      doc.flowChart = generateFlowChartFromHaccp(doc);
    }
    this.normalizeDocumentVersion(doc);
  },

  documentHasPlanContent(doc) {
    return Boolean(doc?.processSteps?.length);
  },

  normalizeDocumentVersion(doc) {
    if (!doc || this.documentHasPlanContent(doc)) return;
    if (doc.version !== 1) doc.version = 1;
  },

  ensureSandwichSampleFresh(doc) {
    if (doc._sampleKey !== 'sandwich') return;
    const needsRefresh =
      doc._sampleVersion !== 4 || !Array.isArray(doc.processSteps) || doc.processSteps.length < 15;
    if (!needsRefresh) return;
    const fresh = createSandwichSampleDocument();
    const { id, version, lastModified } = doc;
    Object.assign(doc, fresh);
    doc.id = id;
    doc.version = version;
    doc.lastModified = lastModified;
  },

  ensureSandwichFlowChart(doc) {
    /* handled in migrateDocument via generateFlowChartFromHaccp */
  },

  migrateStepStructure(step) {
    if (Array.isArray(step.controlMeasures)) {
      step.hazards = (step.hazards || []).map((h) => ({
        id: h.id || crypto.randomUUID(),
        text: h.text || h.hazard || '',
      }));
      ['controlMeasures', 'criticalLimits', 'monitoringProcedures', 'frequencies', 'correctiveActions', 'records'].forEach(
        (key) => {
          if (!Array.isArray(step[key])) step[key] = step[key] ? [step[key]] : [];
        }
      );
      return;
    }

    const old = step.hazards || [];
    if (!old.length) {
      step.hazards = [];
      step.controlMeasures = [];
      step.criticalLimits = [];
      step.monitoringProcedures = [];
      step.frequencies = [];
      step.correctiveActions = [];
      step.records = [];
      return;
    }

    if (old[0].controlMeasures === undefined && old[0].hazard === undefined && old[0].text) {
      return;
    }

    const fieldMap = {
      controlMeasures: 'controlMeasures',
      criticalLimits: 'criticalLimit',
      monitoringProcedures: 'monitoring',
      frequencies: 'frequency',
      correctiveActions: 'correctiveAction',
      records: 'record',
    };

    step.hazards = old.map((h) => ({ id: h.id || crypto.randomUUID(), text: h.hazard || h.text || '' }));

    Object.entries(fieldMap).forEach(([newKey, oldKey]) => {
      const vals = old.map((h) => h[oldKey] || '');
      const nonEmpty = vals.filter(Boolean);
      if (!nonEmpty.length) {
        step[newKey] = [];
      } else if (vals.length > 1 && nonEmpty.every((v) => v === nonEmpty[0])) {
        step[newKey] = [nonEmpty[0]];
      } else {
        step[newKey] = vals;
      }
    });
  },

  migrateNoFields(item) {
    if (item.stepNo !== undefined) return;
    if (item.ccpNo !== undefined && item.ccpNo !== '') {
      item.stepNo = String(item.ccpNo);
      item.isCcp = true;
    } else {
      item.stepNo = '';
      item.isCcp = false;
    }
    delete item.ccpNo;
  },

  save(bumpVersion = false) {
    const doc = this.getActiveDocument();
    if (doc) {
      if (bumpVersion) doc.version += 1;
      doc.lastModified = new Date().toISOString();
    }
    this.cacheLocally();
    this.queueServerSave(false);
  },

  getActiveDocument() {
    return this.library.documents[this.library.activeDocId];
  },

  setActiveDocument(id) {
    if (!this.library.documents[id]) return;
    this.library.activeDocId = id;
    this.save(false);
  },

  getAllDocuments() {
    return Object.values(this.library.documents)
      .map((doc) => {
        const hazardCount = (doc.processSteps || []).reduce((n, s) => n + (s.hazards?.length || 0), 0);
        return {
          id: doc.id,
          title: doc.title,
          version: doc.version,
          lastModified: doc.lastModified,
          stepCount: doc.processSteps?.length || 0,
          hazardCount,
          isEmpty: hazardCount === 0 && !(doc.processSteps?.length),
          isActive: this.library.activeDocId === doc.id,
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  },

  createDocument(title) {
    const id = `doc-${Date.now().toString(36)}`;
    const document = createEmptyDocument(id, title);
    document.version = 1;
    this.library.documents[id] = document;
    this.library.activeDocId = id;
    this.cacheLocally();
    this.queueServerSave(true);
    return id;
  },

  duplicateDocument(id) {
    const source = this.library.documents[id];
    if (!source) return null;

    const newId = `doc-${Date.now().toString(36)}`;
    const copy = cloneSample(source);
    copy.id = newId;
    copy.title = `Copy of ${source.title || 'HACCP Plan'}`;
    copy.version = 1;
    copy.lastModified = new Date().toISOString();
    delete copy._sampleKey;
    delete copy._sampleVersion;

    this.library.documents[newId] = copy;
    this.library.activeDocId = newId;
    this.migrateDocument(copy);
    this.cacheLocally();
    this.queueServerSave(true);
    return newId;
  },

  renameDocument(id, title) {
    const doc = this.library.documents[id];
    if (!doc) return false;
    const trimmed = (title || '').trim();
    if (!trimmed) return false;
    doc.title = trimmed;
    doc.lastModified = new Date().toISOString();
    this.save(false);
    return true;
  },

  deleteDocument(id) {
    if (!this.library.documents[id]) return false;
    delete this.library.documents[id];
    if (this.library.activeDocId === id) this.library.activeDocId = null;
    this.cacheLocally();
    this.queueServerSave(true);
    return true;
  },

  goToDashboard() {
    this.library.activeDocId = null;
    this.save(false);
  },

  openDocument(id) {
    if (!this.library.documents[id]) return false;
    this.library.activeDocId = id;
    this.cacheLocally();
    this.queueServerSave(true);
    return true;
  },

  resetSandwichToSample() {
    const active = this.getActiveDocument();
    if (!active || active._sampleKey !== 'sandwich') return;
    const fresh = createSandwichSampleDocument();
    fresh.id = active.id;
    fresh.version = active.version;
    this.library.documents[active.id] = fresh;
    this.save(true);
  },

  exportDocument(id) {
    const doc = this.library.documents[id];
    if (!doc) return null;
    return JSON.stringify(doc, null, 2);
  },

  importDocument(id, data) {
    if (!Array.isArray(data.processSteps)) return false;
    const targetId = id && this.library.documents[id] ? id : `doc-${Date.now().toString(36)}`;
    this.library.documents[targetId] = {
      id: targetId,
      title: data.title || (id && this.library.documents[id]?.title) || 'Imported HACCP Plan',
      version: typeof data.version === 'number' ? data.version : 1,
      lastModified: new Date().toISOString(),
      processSteps: data.processSteps,
      footnote: data.footnote || '',
      flowChart: normalizeFlowChart(data.flowChart),
      ...(data._sampleKey ? { _sampleKey: data._sampleKey, _sampleVersion: data._sampleVersion } : {}),
    };
    this.migrateDocument(this.library.documents[targetId]);
    this.save(false);
    return targetId;
  },
};
