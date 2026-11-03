// Template Maker — UI. Drawing lives in render.js, PDF output in pdf.js,
// file access in the native TemplateFiles plugin (TemplateFilesPlugin.java).
import { render, migrate, DEFAULTS, PATTERNS, HEADERS, WATERMARKS, FOOTERS, SUB_ALIGNS, SUB_BGS, DATE_STYLES, DATE_POSITIONS, ALIGNS, usesPageNumbers, safeFileName } from './render.js';
import { buildPdf, toGray } from './pdf.js';

const $ = (id) => document.getElementById(id);
const Cap = window.Capacitor;
const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.nativePromise);
const call = (method, args = {}) => Cap.nativePromise('TemplateFiles', method, args);

/* ---------- paper sizes ---------- */

const PAPERS = [
  { id: 'device', label: 'This tablet' },
  { id: 'b103hi', label: '10.3" 2480×1860', w: 1860, h: 2480, ppi: 300 },
  { id: 'b103', label: '10.3" 1872×1404', w: 1404, h: 1872, ppi: 227 },
  { id: 'b133', label: '13.3" 2200×1650', w: 1650, h: 2200, ppi: 207 },
  { id: 'b78', label: '7.8" 1872×1404', w: 1404, h: 1872, ppi: 300 },
  { id: 'a4', label: 'A4 300 dpi', w: 2480, h: 3508, ppi: 300 },
  { id: 'letter', label: 'Letter 300 dpi', w: 2550, h: 3300, ppi: 300 },
];

/* ---------- state ---------- */

const KEY = 'afs-template-maker-v1';
const OUT_DEFAULTS = { format: 'png', pages: 1, dest: native ? 'boox' : 'download', folder: '', paper: 'device', landscape: false, ppi: 0, batchOn: false, batch: '' };
let state = { s: { ...DEFAULTS }, out: { ...OUT_DEFAULTS }, saved: [] };
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw) state = { s: { ...DEFAULTS, ...migrate(raw.s || {}) }, out: { ...OUT_DEFAULTS, ...raw.out }, saved: Array.isArray(raw.saved) ? raw.saved : [] };
} catch { /* storage unavailable: start fresh */ }
if (!native && state.out.dest !== 'download') state.out.dest = 'download';

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

let device = {
  width: Math.round(Math.min(screen.width, screen.height) * (devicePixelRatio || 1)),
  height: Math.round(Math.max(screen.width, screen.height) * (devicePixelRatio || 1)),
  ppi: 300, allFiles: false, folders: [], notesApp: false,
};

function paper() {
  const p = PAPERS.find((x) => x.id === state.out.paper) || PAPERS[0];
  let w = p.id === 'device' ? device.width : p.w;
  let h = p.id === 'device' ? device.height : p.h;
  const ppi = state.out.ppi || (p.id === 'device' ? device.ppi : p.ppi);
  if (state.out.landscape) [w, h] = [h, w];
  return { w, h, ppi };
}

function today() {
  const d = new Date();
  return { date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }), year: String(d.getFullYear()) };
}

/* ---------- settings panel (declarative) ---------- */

const SHADES_LINE = [['Faint', 205], ['Light', 185], ['Medium', 165], ['Dark', 120], ['Black', 0]];
const SHADES_MARK = [['Faint', 240], ['Light', 228], ['Medium', 205], ['Dark', 170]];
const spacingLabel = () => ({ lined: 'Line spacing', cornell: 'Line spacing', meeting: 'Line spacing', todo: 'Row height', isometric: 'Triangle size', titleblock: 'Dot spacing', blank: 'Spacing' }[state.s.pattern] || 'Grid size');

const GROUPS = [
  { title: 'Notebook', rows: [
    { type: 'text', key: 'name', label: 'Notebook name', hint: 'Shown on every page. Use the same name as the notebook in Notes.' },
    { type: 'text', key: 'subtitle', label: 'Second line (optional)', hint: 'Project number, client, course… Tokens: {date} {year} {page} {pages}' },
    { type: 'toggle', o: true, key: 'batchOn', label: 'Several notebooks at once' },
    { type: 'area', o: true, key: 'batch', label: 'Notebook names, one per line', when: () => state.out.batchOn, hint: 'Creates one template per name with the settings below.' },
  ] },
  { title: 'Name header', rows: [
    { type: 'seg', key: 'header', label: 'Style', options: HEADERS, grid: true },
    { type: 'seg', key: 'font', label: 'Typeface', options: [['sans', 'Sans'], ['serif', 'Serif'], ['mono', 'Mono']] },
    { type: 'toggle', key: 'bold', label: 'Bold name' },
    { type: 'step', key: 'headerSize', label: 'Name size', min: 3, max: 25, step: 0.5, unit: 'mm', when: () => state.s.header !== 'none' || state.s.footer !== 'none' },
    { type: 'step', key: 'headerPadTop', label: 'Space above header', min: 0, max: 60, step: 1, unit: 'mm', hint: 'Added to the top margin. Handy to clear the Notes toolbar.' },
    { type: 'toggle', key: 'headerRule', label: 'Rule under the header', when: () => ['left', 'center', 'right'].includes(state.s.header) },
  ] },
  { title: 'Second line', when: () => state.s.subtitle.trim() !== '', rows: [
    { type: 'seg', key: 'subAlign', label: 'Alignment', options: SUB_ALIGNS },
    { type: 'seg', key: 'subBg', label: 'Background', options: SUB_BGS, grid: true },
    { type: 'step', key: 'subSize', label: 'Text size', min: 2, max: 15, step: 0.5, unit: 'mm' },
    { type: 'step', key: 'subGap', label: 'Space above', min: 0, max: 20, step: 0.5, unit: 'mm' },
  ] },
  { title: 'Date', rows: [
    { type: 'seg', key: 'dateStyle', label: 'Date field', options: DATE_STYLES, grid: true, hint: 'Write-in styles leave a line to date each page by hand, journal-style.' },
    { type: 'seg', key: 'datePos', label: 'Position', options: DATE_POSITIONS, when: () => state.s.dateStyle !== 'none' },
    { type: 'seg', key: 'dateAlign', label: 'Alignment on its row', options: ALIGNS, when: () => state.s.dateStyle !== 'none' && (state.s.datePos === 'row' || state.s.header === 'none') },
    { type: 'text', key: 'dateLabel', label: 'Label', hint: 'Shown before the line, e.g. Date, Day, Entry. Leave empty for just the line.', when: () => state.s.dateStyle !== 'none' },
    { type: 'step', key: 'dateSize', label: 'Date size', min: 2, max: 12, step: 0.5, unit: 'mm', when: () => state.s.dateStyle !== 'none' },
  ] },
  { title: 'Watermark & footer', rows: [
    { type: 'seg', key: 'watermark', label: 'Watermark', options: WATERMARKS, grid: true },
    { type: 'step', key: 'watermarkSize', label: 'Watermark size', min: 6, max: 90, step: 2, unit: 'mm', when: () => state.s.watermark !== 'none' },
    { type: 'seg', key: 'watermarkShade', label: 'Watermark shade', options: SHADES_MARK, when: () => state.s.watermark !== 'none' },
    { type: 'seg', key: 'footer', label: 'Footer', options: FOOTERS, hint: 'Page numbers count up in a multi-page PDF; a single template gets a blank "p. ___" to fill in.' },
  ] },
  { title: 'Page', rows: [
    { type: 'seg', key: 'pattern', label: 'Pattern', options: PATTERNS, grid: true },
    { type: 'step', key: 'spacing', label: spacingLabel, min: 3, max: 25, step: 0.5, unit: 'mm', when: () => state.s.pattern !== 'blank' },
    { type: 'step', key: 'majorEvery', label: 'Heavy line every', min: 2, max: 10, step: 1, unit: 'cells', when: () => state.s.pattern === 'engineering' },
    { type: 'seg', key: 'lineShade', label: 'Line shade', options: SHADES_LINE, when: () => state.s.pattern !== 'blank' },
    { type: 'seg', key: 'lineWeight', label: 'Line weight', options: [['thin', 'Thin'], ['regular', 'Regular'], ['bold', 'Bold']], when: () => state.s.pattern !== 'blank' },
    { type: 'toggle', key: 'leftRule', label: 'Margin line on the left', when: () => state.s.pattern === 'lined' },
    { type: 'margins', label: 'Margins (mm)', hint: 'Leave room where the Notes toolbar sits.' },
  ] },
  { title: 'Paper', rows: [
    { type: 'seg', o: true, key: 'paper', label: 'Size', options: () => PAPERS.map((p) => [p.id, p.id === 'device' ? `This tablet ${device.width}×${device.height}` : p.label]), grid: true },
    { type: 'seg', o: true, key: 'landscape', label: 'Orientation', options: [[false, 'Portrait'], [true, 'Landscape']] },
    { type: 'step', o: true, key: 'ppi', label: 'Pixels per inch', min: 100, max: 450, step: 1, unit: 'ppi', get: () => paper().ppi, hint: 'Sets how big a millimetre is. Match your screen so spacing is true to size.' },
  ] },
  { title: 'Output', rows: [
    { type: 'seg', o: true, key: 'format', label: 'File type', options: [['png', 'PNG image'], ['pdf', 'PDF']] },
    { type: 'step', o: true, key: 'pages', label: 'PDF pages', min: 1, max: 200, step: 1, unit: 'pages', big: 10, when: () => state.out.format === 'pdf',
      hint: 'One page for a template. Many pages make a ready-made notebook: open the PDF in Notes and the name is on every page.' },
    { type: 'seg', o: true, key: 'dest', label: 'Send to', options: () => native ? [['boox', 'Templates folder'], ['downloads', 'Downloads'], ['share', 'Share…']] : [['download', 'Download']] },
    { type: 'access', when: () => native && state.out.dest === 'boox' },
    { type: 'folders', when: () => native && state.out.dest === 'boox' && device.allFiles },
  ] },
  { title: 'Saved setups', rows: [{ type: 'saved' }] },
];

const panel = $('settings');
const refreshers = [];

function store(row) { return row.o ? state.out : state.s; }
function resolve(v) { return typeof v === 'function' ? v() : v; }

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) n.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) n.append(c);
  return n;
}

function changed({ rebuild = false } = {}) {
  persist();
  if (rebuild) buildPanel(); else refreshPanel();
  schedulePreview();
}

function rowFor(row) {
  const wrap = el('div', { class: 'row' });
  const labelEl = row.label ? el('span', { class: 'lab' }) : null;
  if (labelEl) wrap.append(labelEl);
  const S = store(row);
  let refresh = () => {};

  if (row.type === 'text') {
    const input = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', value: S[row.key] ?? '' });
    input.addEventListener('input', () => { S[row.key] = input.value; persist(); refreshGroups(); schedulePreview(); updateCreate(); });
    wrap.append(input);
  } else if (row.type === 'area') {
    const ta = el('textarea', { spellcheck: 'false' });
    ta.value = S[row.key] ?? '';
    ta.addEventListener('input', () => { S[row.key] = ta.value; persist(); updateCreate(); });
    wrap.append(ta);
  } else if (row.type === 'seg' || row.type === 'toggle') {
    const box = el('div', { class: `seg${row.grid ? ' grid' : ''}` });
    wrap.append(box);
    let sig = '';
    refresh = () => {
      const opts = row.type === 'toggle' ? [[false, 'Off'], [true, 'On']] : resolve(row.options);
      const nextSig = JSON.stringify(opts);
      if (nextSig !== sig) {
        sig = nextSig;
        box.replaceChildren(...opts.map(([v, t]) => el('button', { type: 'button', onclick: () => {
          S[row.key] = v;
          if (row.key === 'paper' || row.key === 'landscape') state.out.ppi = 0;
          changed({ rebuild: row.key === 'dest' });
        } }, t)));
        box._vals = opts.map(([v]) => v);
      }
      [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', String(box._vals[i] === S[row.key])));
    };
  } else if (row.type === 'step') {
    const out = el('output');
    const bump = (dir) => {
      const cur = row.get ? row.get() : Number(S[row.key]);
      const step = row.big && cur >= row.big ? row.big : row.step;
      let v = Math.round((cur + dir * step) / row.step) * row.step;
      v = Math.min(row.max, Math.max(row.min, +v.toFixed(2)));
      S[row.key] = v;
      changed();
    };
    wrap.append(el('div', { class: 'stepper' },
      el('button', { type: 'button', 'aria-label': 'Less', onclick: () => bump(-1) }, '−'), out,
      el('button', { type: 'button', 'aria-label': 'More', onclick: () => bump(1) }, '+')));
    refresh = () => { out.textContent = `${row.get ? row.get() : S[row.key]} ${row.unit}`; };
  } else if (row.type === 'margins') {
    const grid = el('div', { class: 'three' });
    const outs = {};
    for (const [key, name] of [['marginTop', 'Top'], ['marginSide', 'Sides'], ['marginBottom', 'Bottom']]) {
      const out = el('output');
      outs[key] = out;
      const bump = (dir) => { state.s[key] = Math.min(40, Math.max(0, state.s[key] + dir * 2)); changed(); };
      grid.append(el('div', {}, el('span', { class: 'hint', style: 'margin:0 0 4px' }, name),
        el('div', { class: 'stepper' },
          el('button', { type: 'button', 'aria-label': `${name} less`, onclick: () => bump(-1) }, '−'), out,
          el('button', { type: 'button', 'aria-label': `${name} more`, onclick: () => bump(1) }, '+'))));
    }
    wrap.append(grid);
    refresh = () => { for (const k in outs) outs[k].textContent = state.s[k]; };
  } else if (row.type === 'access') {
    const box = el('div', { class: 'note' });
    wrap.append(box);
    refresh = () => {
      if (device.allFiles) { box.hidden = true; return; }
      box.hidden = false;
      box.replaceChildren(
        el('p', {}, 'To write straight into the Notes template folder, this app needs Android\'s "All files access". Turn it on for AFS Custom Boox on the next screen, then come back.'),
        el('button', { type: 'button', onclick: grantAccess }, 'Allow file access'));
    };
  } else if (row.type === 'folders') {
    const box = el('div');
    wrap.append(el('span', { class: 'lab' }, 'Template folder'), box);
    refresh = () => {
      const found = device.folders.map((f) => f.path);
      const kids = [];
      if (found.length) {
        kids.push(el('div', { class: 'seg' }, ...found.map((p) => el('button', {
          type: 'button', 'aria-pressed': String(state.out.folder === p),
          onclick: () => { state.out.folder = p; changed({ rebuild: true }); },
        }, p))));
      } else {
        kids.push(el('p', { class: 'empty' }, 'No template folder found on this tablet yet. The one below will be created.'));
      }
      const input = el('input', { type: 'text', value: state.out.folder, autocomplete: 'off', spellcheck: 'false' });
      input.addEventListener('change', () => { state.out.folder = input.value.trim().replace(/^\/+|\/+$/g, ''); persist(); refreshPanel(); });
      kids.push(el('span', { class: 'hint', style: 'margin:12px 0 4px' }, 'Folder on internal storage'), input,
        el('span', { class: 'hint' }, 'In Notes: open the notebook → Template → Local / Custom. If the new template doesn\'t show, close and reopen Notes.'));
      box.replaceChildren(...kids);
    };
  } else if (row.type === 'saved') {
    const list = el('div', { class: 'saved' });
    wrap.append(list, el('div', { class: 'actions' },
      el('button', { type: 'button', onclick: saveSetup }, 'Save this setup'),
      el('button', { type: 'button', onclick: resetAll }, 'Reset to defaults')));
    refresh = () => {
      if (!state.saved.length) { list.replaceChildren(el('p', { class: 'empty' }, 'Saved setups appear here, so a notebook\'s template can be remade in one tap.')); return; }
      list.replaceChildren(...state.saved.map((it, i) => el('div', { class: 'saved-item' },
        el('button', { type: 'button', class: 'load', onclick: () => loadSetup(i) }, it.label),
        el('button', { type: 'button', class: 'del', 'aria-label': `Delete ${it.label}`, onclick: () => deleteSetup(i) }, '✕'))));
    };
  }

  if (row.hint) wrap.append(el('span', { class: 'hint' }, row.hint));
  refreshers.push(() => {
    wrap.hidden = row.when ? !row.when() : false;
    if (labelEl) labelEl.textContent = resolve(row.label);
    refresh();
  });
  return wrap;
}

function buildPanel() {
  const top = panel.scrollTop;
  refreshers.length = 0;
  panel.replaceChildren(...GROUPS.map((g) => {
    const sec = el('section', { class: 'group' }, el('h2', {}, g.title), ...g.rows.map(rowFor));
    sec._when = g.when;
    return sec;
  }));
  refreshPanel();
  panel.scrollTop = top;
}
function refreshGroups() {
  for (const sec of panel.children) sec.hidden = sec._when ? !sec._when() : false;
}
function refreshPanel() {
  refreshGroups();
  refreshers.forEach((f) => f());
  updateCreate();
}

/* ---------- saved setups ---------- */

function saveSetup() {
  const label = (state.s.name || 'Untitled').trim() || 'Untitled';
  const entry = { label, s: { ...state.s }, out: { format: state.out.format, pages: state.out.pages, paper: state.out.paper, landscape: state.out.landscape, ppi: state.out.ppi } };
  const at = state.saved.findIndex((x) => x.label === label);
  if (at >= 0) state.saved[at] = entry; else state.saved.unshift(entry);
  changed();
  setStatus(`Saved "${label}".`);
}
function loadSetup(i) {
  const it = state.saved[i];
  if (!it) return;
  state.s = { ...DEFAULTS, ...migrate(it.s || {}) };
  Object.assign(state.out, it.out || {});
  changed({ rebuild: true });
  setStatus(`Loaded "${it.label}".`);
}
function deleteSetup(i) {
  const it = state.saved[i];
  if (!it || !confirm(`Delete the saved setup "${it.label}"?`)) return;
  state.saved.splice(i, 1);
  changed();
}
function resetAll() {
  if (!confirm('Reset every setting to the defaults? Saved setups are kept.')) return;
  state.s = { ...DEFAULTS };
  state.out = { ...OUT_DEFAULTS, folder: state.out.folder };
  changed({ rebuild: true });
}

/* ---------- preview ---------- */

let previewQueued = false;
function schedulePreview() {
  if (previewQueued) return;
  previewQueued = true;
  requestAnimationFrame(() => { previewQueued = false; drawPreview(); });
}

function drawPreview() {
  const { w, h, ppi } = paper();
  const box = $('paperbox').getBoundingClientRect();
  if (!box.width || !box.height) return;
  const scale = Math.min(box.width / w, box.height / h);
  const cssW = Math.max(1, Math.floor(w * scale)), cssH = Math.max(1, Math.floor(h * scale));
  const dpr = devicePixelRatio || 1;
  const c = $('preview');
  c.style.width = `${cssW}px`;
  c.style.height = `${cssH}px`;
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  const k = c.width / w;
  const pages = state.out.format === 'pdf' && state.out.pages > 1 ? state.out.pages : 0;
  render(c.getContext('2d'), c.width, c.height, previewSettings(), { ppi: ppi * k, page: 1, pages, ...today() });
  const mmW = (w / ppi * 25.4).toFixed(0), mmH = (h / ppi * 25.4).toFixed(0);
  $('dims').textContent = `${w} × ${h} px · ${ppi} ppi · ${mmW} × ${mmH} mm`;
}
function previewSettings() {
  const names = batchNames();
  return names.length && !state.s.name.trim() ? { ...state.s, name: names[0] } : state.s;
}

/* ---------- making files ---------- */

function batchNames() {
  if (!state.out.batchOn) return [];
  return [...new Set(state.out.batch.split('\n').map((x) => x.trim()).filter(Boolean))];
}
function jobNames() {
  const list = batchNames();
  return list.length ? list : [state.s.name];
}

function setStatus(t) { $('status').textContent = t; }

function updateCreate() {
  const n = jobNames().length;
  const dest = state.out.dest;
  const what = n > 1 ? `${n} templates` : state.out.format === 'pdf' && state.out.pages > 1 ? 'notebook PDF' : 'template';
  const verb = { boox: 'Save', downloads: 'Save', share: 'Share', download: 'Download' }[dest] || 'Create';
  const btn = $('create');
  btn.textContent = `${verb} ${what}`;
  btn.disabled = busy || (dest === 'share' && n > 1);
  if (dest === 'share' && n > 1 && !busy) setStatus('Share sends one file at a time. Pick Templates folder or Downloads for several names.');
}

function nextFrame() { return new Promise((r) => requestAnimationFrame(() => r())); }

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function makeFile(name, onPage) {
  const s = { ...state.s, name };
  const { w, h, ppi } = paper();
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const t = today();
  const base = safeFileName(name);

  if (state.out.format === 'png') {
    render(ctx, w, h, s, { ppi, page: 0, pages: 0, ...t });
    const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Image encoding failed'))), 'image/png'));
    return { filename: `${base}.png`, mime: 'image/png', bytes: new Uint8Array(await blob.arrayBuffer()) };
  }

  const count = Math.max(1, Math.min(200, state.out.pages | 0));
  const pages = count > 1 ? count : 0;
  const varying = usesPageNumbers(s) && count > 1;
  const bytes = await buildPdf({
    count, width: w, height: h, ppi, title: name,
    getPage: async (i) => {
      if (varying || i === 0) {
        render(ctx, w, h, s, { ppi, page: i + 1, pages, ...t });
        if (i % 5 === 4) await nextFrame();
        return { key: varying ? `p${i}` : 'same', gray: toGray(ctx.getImageData(0, 0, w, h).data) };
      }
      return { key: 'same', gray: null };
    },
    onProgress: onPage,
  });
  return { filename: `${base}.pdf`, mime: 'application/pdf', bytes };
}

let busy = false;

async function create() {
  if (busy) return;
  const names = jobNames().map((n) => n.trim()).filter(Boolean);
  if (!names.length) { setStatus('Type a notebook name first.'); return; }
  const dest = state.out.dest;

  if (dest === 'boox') {
    if (!device.allFiles) {
      setStatus('Allow file access first (Output → Send to).');
      panel.querySelector('.note')?.scrollIntoView();
      return;
    }
    if (!state.out.folder) state.out.folder = device.folders[0]?.path || 'noteTemplate';
  }

  busy = true;
  updateCreate();
  const done = [];
  try {
    for (let n = 0; n < names.length; n++) {
      const prefix = names.length > 1 ? `${n + 1}/${names.length} · ` : '';
      setStatus(`${prefix}Drawing "${names[n]}"…`);
      await nextFrame();
      const file = await makeFile(names[n], (i, total) => { if (total > 1) setStatus(`${prefix}Page ${i} of ${total}…`); });
      setStatus(`${prefix}Saving ${file.filename}…`);
      await nextFrame();

      if (dest === 'download') {
        const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mime }));
        const a = el('a', { href: url, download: file.filename });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        done.push(file.filename);
        continue;
      }
      const base64 = bytesToBase64(file.bytes);
      if (dest === 'boox') {
        const r = await call('saveFile', { folder: state.out.folder, filename: file.filename, base64 });
        done.push(r.path + (r.replaced ? ' (replaced)' : ''));
      } else if (dest === 'downloads') {
        const r = await call('saveToDownloads', { filename: file.filename, base64, mime: file.mime });
        done.push(r.path);
      } else if (dest === 'share') {
        await call('share', { filename: file.filename, base64, mime: file.mime });
        done.push(file.filename);
      }
    }
    const where = { boox: 'Saved', downloads: 'Saved', share: 'Shared', download: 'Downloaded' }[dest];
    const tail = dest === 'boox' ? ' In Notes: Template → Local/Custom.' : '';
    setStatus(done.length === 1 ? `${where}: ${done[0]}.${tail}` : `${where} ${done.length} files to ${dest === 'boox' ? state.out.folder : 'Download/AFS Templates'}.${tail}`);
    if (dest === 'boox') await refreshDevice();
  } catch (err) {
    const msg = String(err?.message || err);
    setStatus(msg === 'NO_ACCESS' ? 'File access was turned off. Allow it again under Output.' : `Couldn't finish: ${msg}`);
    if (msg === 'NO_ACCESS') { device.allFiles = false; refreshPanel(); }
  } finally {
    busy = false;
    persist();
    updateCreate();
  }
}

/* ---------- native ---------- */

async function refreshDevice() {
  if (!native) return;
  try {
    const r = await call('info');
    const dpi = Math.round((Number(r.xdpi) + Number(r.ydpi)) / 2);
    device = {
      width: r.width, height: r.height,
      ppi: dpi >= 120 && dpi <= 450 ? dpi : 300,
      allFiles: !!r.allFiles, notesApp: !!r.notesApp,
      folders: Array.isArray(r.folders) ? r.folders : [],
    };
    if (device.allFiles && !state.out.folder) state.out.folder = device.folders[0]?.path || 'noteTemplate';
  } catch (err) {
    setStatus(`Couldn't read the tablet's details: ${err.message || err}`);
  }
  refreshPanel();
  schedulePreview();
}

async function grantAccess() {
  try {
    const r = await call('requestAllFiles');
    await refreshDevice();
    setStatus(r.allFiles ? 'File access is on. Templates go straight into the Notes folder.' : 'File access is still off. You can use Downloads or Share instead.');
    buildPanel();
  } catch (err) {
    setStatus(`Couldn't open the setting: ${err.message || err}`);
  }
}

/* ---------- start ---------- */

$('create').addEventListener('click', create);
window.addEventListener('resize', schedulePreview);

if (native && Cap.addListener) {
  Cap.addListener('App', 'backButton', () => { location.href = '../../index.html'; });
  Cap.addListener('App', 'resume', () => refreshDevice());
}

buildPanel();
// Draw once fonts are in so the preview uses the right typefaces.
Promise.all(['600 20px "IBM Plex Sans"', '400 20px "IBM Plex Sans"', '500 20px "IBM Plex Sans"', '500 20px "IBM Plex Mono"', '400 20px "Spectral"', '600 20px "Spectral"']
  .map((f) => document.fonts.load(f).catch(() => null))).then(() => schedulePreview());
schedulePreview();
refreshDevice();
