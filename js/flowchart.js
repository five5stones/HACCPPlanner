/**
 * SVG flow chart renderer for HACCP production flows.
 */

const FlowchartRenderer = {
  BOX_MIN_W: 150,
  BOX_MAX_W: 200,
  BOX_MIN_H: 44,
  BOX_PAD_X: 12,
  BOX_PAD_Y: 10,
  NODE_GAP: 20,
  STAGE_GAP: 68,
  LABEL_ABOVE_BOX: 20,
  LABEL_IN_GAP: 16,
  BUS_IN_GAP: 48,
  ARROW_GAP: 48,
  FONT_SIZE: 11,
  LINE_HEIGHT: 14,
  LABEL_BG_ABOVE: 13,
  LABEL_BG_H: 16,

  wrapText(text, maxWidth) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let line = words[0];
    const approxCharW = 6.2;
    const maxChars = Math.floor((maxWidth - this.BOX_PAD_X * 2) / approxCharW);
    for (let i = 1; i < words.length; i += 1) {
      const next = `${line} ${words[i]}`;
      if (next.length <= maxChars) line = next;
      else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
    return lines;
  },

  measureNode(text) {
    const lines = this.wrapText(text, this.BOX_MAX_W);
    const w = Math.min(
      this.BOX_MAX_W,
      Math.max(this.BOX_MIN_W, ...lines.map((l) => l.length * 6.5 + this.BOX_PAD_X * 2))
    );
    const h = Math.max(this.BOX_MIN_H, lines.length * this.LINE_HEIGHT + this.BOX_PAD_Y * 2);
    return { lines, w, h };
  },

  layoutStages(stages, compact = false) {
    const { LABEL_BG_ABOVE, LABEL_BG_H } = this;
    const CLEAR_BELOW_PREV = compact ? 8 : 10;
    const MIN_BELOW_BUS = compact ? 10 : 14;

    const gap = compact
      ? { stage: 48, node: 12, labelAbove: 18, labelInGap: 22, busInGap: 38, boxMinH: 34, boxMaxW: 145, lineHeight: 11, fontSize: 9 }
      : { stage: this.STAGE_GAP, node: this.NODE_GAP, labelAbove: this.LABEL_ABOVE_BOX, labelInGap: 22, busInGap: this.BUS_IN_GAP, boxMinH: this.BOX_MIN_H, boxMaxW: this.BOX_MAX_W, lineHeight: this.LINE_HEIGHT, fontSize: this.FONT_SIZE };

    const measureNode = (text) => {
      const lines = this.wrapText(text, gap.boxMaxW);
      const w = Math.min(
        gap.boxMaxW,
        Math.max(this.BOX_MIN_W, ...lines.map((l) => l.length * (compact ? 5.5 : 6.5) + this.BOX_PAD_X * 2))
      );
      const h = Math.max(gap.boxMinH, lines.length * gap.lineHeight + this.BOX_PAD_Y * 2);
      return { lines, w, h };
    };

    const stageLayouts = [];
    let y = compact ? 36 : 48;
    let maxTotalW = 0;

    stages.forEach((stage, si) => {
      const nodes = (stage.nodes || []).map((n) => {
        const text = typeof n === 'string' ? n : n.text || '';
        const m = measureNode(text);
        return { text, ...m };
      });

      const rowH = nodes.length ? Math.max(...nodes.map((n) => n.h)) : gap.boxMinH;
      const rowW =
        nodes.reduce((s, n) => s + n.w, 0) + Math.max(0, nodes.length - 1) * gap.node;
      maxTotalW = Math.max(maxTotalW, rowW);

      let stageY = y;
      let labelY = null;
      let incomingBusY = null;
      let gapStart = null;

      if (si === 0) {
        labelY = stageY - gap.labelAbove;
      } else {
        const prev = stageLayouts[si - 1];
        gapStart = prev.y + prev.rowH;
        labelY = gapStart + Math.max(gap.labelInGap, LABEL_BG_ABOVE + CLEAR_BELOW_PREV);
        incomingBusY = Math.max(gapStart + gap.busInGap, labelY - LABEL_BG_ABOVE + LABEL_BG_H + 6);
        stageY = Math.max(gapStart + gap.stage, incomingBusY + MIN_BELOW_BUS);
      }

      stageLayouts.push({
        label: stage.label || `Step ${si + 1}`,
        nodes,
        rowW,
        rowH,
        y: stageY,
        labelY,
        incomingBusY,
        gapStart,
        compact,
        gap,
      });

      y = stageY + rowH + (si < stages.length - 1 ? 0 : compact ? 8 : 20);
      if (si < stages.length - 1) {
        const nextGapStart = stageY + rowH;
        const nextLabelY = nextGapStart + Math.max(gap.labelInGap, LABEL_BG_ABOVE + CLEAR_BELOW_PREV);
        const nextBusY = Math.max(nextGapStart + gap.busInGap, nextLabelY - LABEL_BG_ABOVE + LABEL_BG_H + 6);
        y = Math.max(nextGapStart + gap.stage, nextBusY + MIN_BELOW_BUS);
      }
    });

    const totalW = Math.max(maxTotalW + (compact ? 40 : 80), compact ? 280 : 320);
    const totalH = y;

    stageLayouts.forEach((stage, si) => {
      const startX = (totalW - stage.rowW) / 2;
      let x = startX;
      stage.nodes.forEach((node) => {
        node.x = x;
        node.y = stage.y;
        x += node.w + stage.gap.node;
      });
    });

    return { stageLayouts, totalW, totalH, compact, gap };
  },

  connectorPath(from, to, busY) {
    const x1 = from.x + from.w / 2;
    const y1 = from.y + from.h;
    const x2 = to.x + to.w / 2;
    const y2 = to.y;
    return `M ${x1} ${y1} L ${x1} ${busY} L ${x2} ${busY} L ${x2} ${y2}`;
  },

  render(container, flowChart, docTitle, options = {}) {
    const compact = Boolean(options.compact);
    const stages = flowChart?.stages || [];
    container.innerHTML = '';

    if (!stages.length) {
      container.innerHTML =
        '<p class="flowchart-empty">No flow chart yet. Add stages in the editor on the left.</p>';
      return;
    }

    const title = flowChart.title || `${docTitle || 'HACCP'} Flow Chart`;
    let { stageLayouts, totalW, totalH, gap } = this.layoutStages(stages, compact);

    const PRINT_FIT = { maxW: 520, maxH: 500 };
    let fitScale = 1;
    if (compact) {
      fitScale = Math.min(1, PRINT_FIT.maxW / totalW, PRINT_FIT.maxH / totalH);
    }
    const viewW = totalW * fitScale;
    const viewH = totalH * fitScale;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'flowchart-svg');
    svg.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    if (compact) svg.setAttribute('height', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
    svg.dataset.totalW = String(viewW);
    svg.dataset.totalH = String(viewH);
    svg.dataset.fitScale = String(fitScale);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="fc-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#333"/>
      </marker>`;
    svg.appendChild(defs);

    const connectors = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectors.setAttribute('class', 'fc-connectors');
    const nodesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesLayer.setAttribute('class', 'fc-nodes');

    stageLayouts.forEach((stage, si) => {
      const labelW = Math.max(stage.label.length * (compact ? 5.5 : 6.2) + 20, 80);
      const labelX = totalW / 2 - labelW / 2;
      const labelBgTop = stage.labelY - this.LABEL_BG_ABOVE;

      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', labelX);
      labelBg.setAttribute('y', labelBgTop);
      labelBg.setAttribute('width', labelW);
      labelBg.setAttribute('height', this.LABEL_BG_H);
      labelBg.setAttribute('rx', 3);
      labelBg.setAttribute('class', 'fc-stage-label-bg');
      nodesLayer.appendChild(labelBg);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', totalW / 2);
      label.setAttribute('y', stage.labelY);
      label.setAttribute('class', 'fc-stage-label');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', compact ? 9 : 10);
      label.textContent = stage.label.toUpperCase();
      nodesLayer.appendChild(label);

      stage.nodes.forEach((node) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'fc-node');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', node.x);
        rect.setAttribute('y', node.y);
        rect.setAttribute('width', node.w);
        rect.setAttribute('height', node.h);
        rect.setAttribute('rx', 8);
        rect.setAttribute('class', 'fc-box');
        g.appendChild(rect);

        node.lines.forEach((line, li) => {
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', node.x + node.w / 2);
          t.setAttribute('y', node.y + this.BOX_PAD_Y + (compact ? 10 : 12) + li * gap.lineHeight);
          t.setAttribute('class', 'fc-box-text');
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('font-size', gap.fontSize);
          t.textContent = line;
          g.appendChild(t);
        });

        nodesLayer.appendChild(g);
      });

      if (si === 0) return;

      const prev = stageLayouts[si - 1];
      const busY = stage.incomingBusY ?? prev.y + prev.rowH + stage.gap.busInGap;

      prev.nodes.forEach((from) => {
        stage.nodes.forEach((to) => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', this.connectorPath(from, to, busY));
          path.setAttribute('class', 'fc-connector');
          path.setAttribute('fill', 'none');
          path.setAttribute('marker-end', 'url(#fc-arrow)');
          connectors.appendChild(path);
        });
      });
    });

    svg.appendChild(connectors);
    svg.appendChild(nodesLayer);

    if (fitScale < 1) {
      const scaleAttr = `scale(${fitScale})`;
      connectors.setAttribute('transform', scaleAttr);
      nodesLayer.setAttribute('transform', scaleAttr);
    }

    const wrap = document.createElement('div');
    wrap.className = 'flowchart-svg-wrap';
    if (compact) wrap.classList.add('flowchart-svg-wrap--print');
    wrap.appendChild(svg);
    container.appendChild(wrap);
  },
};

const SANDWICH_FLOWCHART = {
  title: 'Sandwich Production HACCP Flow Chart',
  stages: [
    { id: 'fc-s1', label: 'Step One', nodes: [{ id: 'fc-n1', text: 'Raw Materials Purchase' }] },
    {
      id: 'fc-s2',
      label: 'Step Two',
      nodes: [
        { id: 'fc-n2a', text: 'Receipt of Raw Materials' },
        { id: 'fc-n2b', text: 'Storage of Raw Materials' },
      ],
    },
    {
      id: 'fc-s3',
      label: 'Step Three',
      nodes: [
        { id: 'fc-n3a', text: 'Defrosting' },
        { id: 'fc-n3b', text: 'Salad and Vegetable Cleaning' },
        { id: 'fc-n3c', text: 'Work in Progress Chilled Storage' },
        { id: 'fc-n3d', text: 'High Risk Preparation Slicing, Dicing and Can Opening' },
      ],
    },
    {
      id: 'fc-s4',
      label: 'Step Four',
      nodes: [{ id: 'fc-n4', text: 'Labelling Ingredients and Mixes' }],
    },
    {
      id: 'fc-s5',
      label: 'Step Five',
      nodes: [
        { id: 'fc-n5a', text: 'Sandwich Assembly' },
        { id: 'fc-n5b', text: 'Cutting' },
      ],
    },
    {
      id: 'fc-s6',
      label: 'Step Six',
      nodes: [
        { id: 'fc-n6a', text: 'Packing' },
        { id: 'fc-n6b', text: 'Labelling' },
      ],
    },
    {
      id: 'fc-s7',
      label: 'Step Seven',
      nodes: [
        { id: 'fc-n7a', text: 'Storage before Despatch' },
        { id: 'fc-n7b', text: 'Storage in Despatch' },
      ],
    },
  ],
};

function createEmptyFlowChart() {
  return { title: '', stages: [], manualEdit: false };
}

function flowProcessSteps(steps) {
  return (steps || []).filter((s) => !s.isReferenceStep);
}

const STEP_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Process steps in the HACCP table but not shown on the sandwich flow chart. */
const SANDWICH_FLOW_EXCLUDE = ['Supplier Approval'];

/** Sandwich production flow groups (from PDF flow chart). */
const SANDWICH_FLOW_GROUPS = SANDWICH_FLOWCHART.stages.map((stage) => ({
  label: stage.label,
  names: stage.nodes.map((n) => n.text),
}));

function namesMatch(a, b) {
  const x = String(a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const y = String(b || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return x === y || x.includes(y) || y.includes(x);
}

function generateFlowChartFromHaccp(document, { force = false } = {}) {
  const steps = flowProcessSteps(document.processSteps || []);
  const title = `${document.title || 'HACCP'} Flow Chart`;

  if (!steps.length) {
    return { title, stages: [], manualEdit: false };
  }

  if (document.flowChart?.manualEdit && !force) {
    return normalizeFlowChart(document.flowChart);
  }

  const groups = document._sampleKey === 'sandwich' ? SANDWICH_FLOW_GROUPS : null;
  const used = new Set();

  if (groups) {
    const stages = groups
      .map((group) => {
        const nodes = group.names
          .map((name) => steps.find((s) => !used.has(s.id) && namesMatch(s.name, name)))
          .filter(Boolean);
        nodes.forEach((s) => used.add(s.id));
        return {
          id: `fc-${group.label.replace(/\s+/g, '-').toLowerCase()}`,
          label: group.label,
          nodes: nodes.map((s) => ({ id: `fc-node-${s.id}`, text: s.name })),
        };
      })
      .filter((stage) => stage.nodes.length);

    const leftover = steps.filter(
      (s) => !used.has(s.id) && !SANDWICH_FLOW_EXCLUDE.some((ex) => namesMatch(s.name, ex))
    );
    leftover.forEach((s, i) => {
      stages.push({
        id: `fc-extra-${s.id}`,
        label: `Step ${STEP_WORDS[stages.length] || stages.length + 1}`,
        nodes: [{ id: `fc-node-${s.id}`, text: s.name }],
      });
    });

    return { title, stages, manualEdit: false };
  }

  return {
    title,
    manualEdit: false,
    stages: steps.map((s, i) => ({
      id: `fc-stage-${i}`,
      label: `Step ${STEP_WORDS[i] || i + 1}`,
      nodes: [{ id: `fc-node-${s.id}`, text: s.name }],
    })),
  };
}

function normalizeFlowChart(raw) {
  if (!raw || !Array.isArray(raw.stages)) return createEmptyFlowChart();
  return {
    title: raw.title || '',
    manualEdit: Boolean(raw.manualEdit),
    stages: raw.stages.map((s, i) => ({
      id: s.id || `fc-stage-${i}`,
      label: s.label || `Step ${i + 1}`,
      nodes: (s.nodes || []).map((n, j) => ({
        id: (typeof n === 'object' && n.id) || `fc-node-${i}-${j}`,
        text: typeof n === 'string' ? n : n.text || '',
      })),
    })),
  };
}
