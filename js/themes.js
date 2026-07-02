/**
 * Per-document HACCP colour themes (six options).
 */
const HACCP_THEME_IDS = ['blue', 'teal', 'forest', 'purple', 'slate', 'burgundy'];

const HACCP_THEMES = [
  {
    id: 'blue',
    label: 'Blue',
    accent: '#5b9bd5',
    cell: '#dce6f2',
    cellAlt: '#d4e0f0',
    header: '#1f1f1f',
  },
  {
    id: 'teal',
    label: 'Teal',
    accent: '#2a9d8f',
    cell: '#d4ece8',
    cellAlt: '#c8e4df',
    header: '#1a3330',
  },
  {
    id: 'forest',
    label: 'Forest',
    accent: '#4a7c59',
    cell: '#dce8df',
    cellAlt: '#d0e0d4',
    header: '#1f2e22',
  },
  {
    id: 'purple',
    label: 'Purple',
    accent: '#7b68c4',
    cell: '#e4dff0',
    cellAlt: '#dcd4ec',
    header: '#2a2438',
  },
  {
    id: 'slate',
    label: 'Slate',
    accent: '#5a6a7a',
    cell: '#e0e4e8',
    cellAlt: '#d4dae0',
    header: '#1f252b',
  },
  {
    id: 'burgundy',
    label: 'Burgundy',
    accent: '#9e4b4b',
    cell: '#ecd8d8',
    cellAlt: '#e4cccc',
    header: '#2e1a1a',
  },
];

function normalizeThemeId(themeId) {
  return HACCP_THEME_IDS.includes(themeId) ? themeId : 'blue';
}

function getDocumentTheme(themeId) {
  const id = normalizeThemeId(themeId);
  return HACCP_THEMES.find((theme) => theme.id === id) || HACCP_THEMES[0];
}

function applyDocumentTheme(documentData) {
  const theme = getDocumentTheme(documentData?.theme);
  ['haccp-document', 'flowchart-document'].forEach((elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    HACCP_THEME_IDS.forEach((id) => el.classList.remove(`theme-${id}`));
    el.classList.add(`theme-${theme.id}`);
  });
}

function renderThemePicker(container, selectedId, onSelect) {
  const selected = normalizeThemeId(selectedId);
  container.innerHTML = HACCP_THEMES.map(
    (theme) => `
    <button type="button" class="theme-swatch${theme.id === selected ? ' theme-swatch--active' : ''}"
      data-theme-id="${theme.id}"
      aria-label="${theme.label} theme"
      aria-pressed="${theme.id === selected}"
      title="${theme.label}">
      <span class="theme-swatch-chip" style="--swatch-accent:${theme.accent};--swatch-cell:${theme.cell}"></span>
      <span class="theme-swatch-label">${theme.label}</span>
    </button>`
  ).join('');

  container.querySelectorAll('[data-theme-id]').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.dataset.themeId));
  });
}

function syncThemePicker(selectedId) {
  const selected = normalizeThemeId(selectedId);
  document.querySelectorAll('#theme-picker [data-theme-id]').forEach((btn) => {
    const active = btn.dataset.themeId === selected;
    btn.classList.toggle('theme-swatch--active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}
