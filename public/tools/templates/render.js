// Template Maker — pure drawing. No DOM access, so scripts/validate-templates.mjs can run it
// in Node against a mock canvas. Every size is in millimetres and converted with the page's PPI,
// so the same settings look the same on any resolution (and in the scaled-down preview).

export const FONTS = {
  sans: '"IBM Plex Sans", system-ui, sans-serif',
  serif: '"Spectral", Georgia, serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
};

export const PATTERNS = [
  ['blank', 'Blank'],
  ['lined', 'Lined'],
  ['dots', 'Dot grid'],
  ['grid', 'Square grid'],
  ['engineering', 'Engineering'],
  ['isometric', 'Isometric'],
  ['cornell', 'Cornell'],
  ['meeting', 'Meeting'],
  ['todo', 'To-do'],
  ['titleblock', 'Title block'],
];

export const HEADERS = [
  ['none', 'None'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right'], ['bar', 'Black bar'], ['tab', 'Label box'],
];
export const WATERMARKS = [
  ['none', 'None'], ['center', 'Centre'], ['diagonal', 'Diagonal'], ['tile', 'Repeat'], ['spine', 'Spine'],
];
export const FOOTERS = [['none', 'None'], ['name', 'Name'], ['page', 'Page no.'], ['both', 'Both']];
export const SUB_ALIGNS = [['same', 'Match name'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']];
export const SUB_BGS = [['none', 'None'], ['band', 'Grey band'], ['black', 'Black band'], ['outline', 'Outline box'], ['tag', 'Black tag']];
export const DATE_POSITIONS = [['header', 'In header'], ['row', 'Own row'], ['footer', 'Footer']];
export const ALIGNS = [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']];

export const DEFAULTS = {
  name: 'Notebook',
  subtitle: '',
  font: 'sans',
  bold: true,
  header: 'left',
  headerSize: 7, // mm, name height
  headerPadTop: 0, // mm of extra space above the header
  headerRule: true,
  subAlign: 'same',
  subSize: 4, // mm
  subGap: 1.5, // mm above the second line
  subBg: 'none',
  dateOn: false,
  dateWeekdays: false,
  datePos: 'header',
  dateAlign: 'right', // for datePos 'row'
  dateLabel: 'Date',
  dateSize: 3.5, // mm
  watermark: 'none',
  watermarkSize: 28, // mm
  watermarkShade: 221, // 0 black … 255 white
  footer: 'none',
  pattern: 'lined',
  spacing: 8, // mm between lines / grid cells / rows
  majorEvery: 5,
  lineShade: 153,
  lineWeight: 'regular',
  leftRule: false,
  marginTop: 8,
  marginSide: 8,
  marginBottom: 8,
};

/** Settings saved by build 14 used a single `date` key. */
export function migrate(s) {
  const out = { ...s };
  if ('date' in out) {
    if (out.dateOn === undefined && out.dateStyle === undefined) out.dateOn = out.date === 'blank' || out.date === 'today';
    delete out.date;
  }
  if ('dateStyle' in out) {
    // Build 15–16 date styles collapse to on/off + weekdays.
    if (out.dateOn === undefined) out.dateOn = out.dateStyle !== 'none';
    if (out.dateWeekdays === undefined) out.dateWeekdays = out.dateStyle === 'weekdays';
    delete out.dateStyle;
    delete out.datePos; delete out.dateAlign; delete out.dateSize; // no longer set from the UI
  }
  // Old shade values from the mislabeled buttons were strings; fall back to defaults.
  for (const k of ['lineShade', 'watermarkShade']) if (k in out && !Number.isFinite(Number(out[k]))) delete out[k];
  return out;
}

const mix = (v, t) => Math.round(v + (255 - v) * t); // lighten toward white
const gray = (v) => {
  const n = Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${n},${n},${n})`;
};
const snap = (v, w) => (Math.round(w) % 2 ? Math.floor(v) + 0.5 : Math.round(v));

export function resolveText(str, info) {
  return String(str ?? '').replace(/\{(name|date|year|page|pages)\}/gi, (_, key) => {
    const v = info[key.toLowerCase()];
    return v ? String(v) : '';
  });
}

/** True when a page's image differs from page to page (so a PDF can't reuse one image). */
export function usesPageNumbers(s) {
  const t = { ...DEFAULTS, ...s };
  return t.footer === 'page' || t.footer === 'both' || t.pattern === 'titleblock' || /\{page/i.test(`${t.name}${t.subtitle}`);
}

export function safeFileName(name) {
  const base = String(name ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '');
  return (base || 'Template').slice(0, 80);
}

/**
 * Draw one template page.
 * @param ctx  CanvasRenderingContext2D (or a mock with the same methods)
 * @param W,H  page size in pixels
 * @param input settings (missing keys fall back to DEFAULTS)
 * @param o    { ppi, page, pages, date, year }
 */
export function render(ctx, W, H, input, o = {}) {
  const s = { ...DEFAULTS, ...migrate(input) };
  const ppi = o.ppi || 300;
  const mm = (v) => (v * ppi) / 25.4;
  const k = ppi / 300;
  const lw = Math.max(1, Math.round(({ thin: 1, regular: 2, bold: 3 }[s.lineWeight] || 2) * k));
  const info = { name: s.name, date: o.date || '', year: o.year || '', page: o.page || 0, pages: o.pages || 0 };
  const name = resolveText(s.name, info).replace(/\s+/g, ' ').trim();
  const sub = resolveText(s.subtitle, info).replace(/\s+/g, ' ').trim();
  const fam = FONTS[s.font] || FONTS.sans;
  const nameWeight = s.bold ? 600 : 400;
  const labelShade = Math.max(0, s.lineShade - 80);
  const d = { ctx, W, H, s, o, mm, lw, fam, name, sub, nameWeight, labelShade, info };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const page = { x: mm(s.marginSide), y: mm(s.marginTop), w: W - 2 * mm(s.marginSide), h: H - mm(s.marginTop) - mm(s.marginBottom) };

  if (name && s.watermark !== 'none') drawWatermark(d, page);

  // Where the date field goes. "In header" falls back to its own row when there is no name header.
  const hasDate = !!s.dateOn;
  const nameRow = s.header !== 'none' && !!name;
  d.datePos = !hasDate ? 'none' : s.datePos === 'header' && !nameRow ? 'row' : s.datePos;

  let top = page.y + mm(s.headerPadTop);
  const startTop = top;
  if (nameRow) top = drawNameRow(d, page, top);
  if (sub) top = drawSubRow(d, page, top + (top > startTop ? mm(s.subGap) : 0));
  if (d.datePos === 'row') top = drawDateRow(d, page, top + (top > startTop ? mm(s.subGap) : 0));
  if (top > startTop && s.headerRule && ['left', 'center', 'right'].includes(s.header)) {
    const rw = lw * 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(page.x, Math.round(top + mm(1)), page.w, rw);
    top += mm(1) + rw;
  }
  if (top > page.y) top += mm(3);

  let bottom = page.y + page.h;
  if (s.footer !== 'none' || d.datePos === 'footer') bottom = drawFooter(d, page) - mm(2);

  const R = { x: page.x, y: top, w: page.w, h: bottom - top };
  if (R.w > mm(5) && R.h > mm(5)) drawPattern(d, R);

  ctx.restore();
}

/* ---------- text helpers ---------- */

function setFont(d, weight, px) {
  d.ctx.font = `${weight} ${Math.max(1, px).toFixed(1)}px ${d.fam}`;
}
/** Shrinks px until text fits maxW (never below 30%). Leaves ctx.font set. */
function fit(d, text, weight, px, maxW) {
  setFont(d, weight, px);
  const w = d.ctx.measureText(text).width;
  if (w > maxW && w > 0) {
    px = Math.max(px * 0.3, (px * maxW) / Math.max(w, 1e-6));
    setFont(d, weight, px);
  }
  return px;
}
function textW(d, text) {
  return d.ctx.measureText(text).width;
}

/* ---------- date field ---------- */

/**
 * Lays out the date field at size px. Returns { w, draw(x, baseline, align, color) }.
 * Handwritten styles are a label plus underline slots to write on.
 */
function dateField(d, px, maxW = Infinity) {
  const f = layoutDate(d, px);
  return f.w > maxW && f.w > 0 ? layoutDate(d, Math.max(px * 0.3, (px * maxW) / f.w)) : f;
}
function layoutDate(d, px) {
  const { ctx, s, lw } = d;
  const label = String(s.dateLabel ?? '').trim();
  const rule = Math.max(1, lw);
  const parts = []; // { kind: 'text'|'slot', text?, w }
  const gap = px * 0.35;
  setFont(d, 400, px);
  const text = (t) => parts.push({ kind: 'text', text: t, w: textW(d, t) });
  const slot = (w) => parts.push({ kind: 'slot', w });
  const space = (w) => parts.push({ kind: 'space', w });

  if (label) { text(label); space(gap); }
  slot(px * 7.5);
  if (s.dateWeekdays) {
    for (const day of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) { space(px * 0.75); text(day); }
  }
  const w = parts.reduce((a, p) => a + p.w, 0);
  return {
    w,
    draw(x, base, align, color) {
      let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      ctx.save();
      setFont(d, 400, px);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = color;
      for (const p of parts) {
        if (p.kind === 'text') ctx.fillText(p.text, cx, base);
        if (p.kind === 'slot') ctx.fillRect(cx, Math.round(base + px * 0.12), p.w, rule);
        cx += p.w;
      }
      ctx.restore();
    },
  };
}

function nameAlign(s) {
  return s.header === 'center' ? 'center' : s.header === 'right' || s.header === 'tab' ? 'right' : 'left';
}
function xFor(page, align, inset = 0) {
  return align === 'center' ? page.x + page.w / 2 : align === 'right' ? page.x + page.w - inset : page.x + inset;
}

/* ---------- header rows ---------- */

function drawNameRow(d, page, y) {
  const { ctx, s, mm, lw, name } = d;
  const px0 = mm(s.headerSize);
  const datePx = mm(s.dateSize);
  const date = d.datePos === 'header' ? dateField(d, datePx, page.w * 0.55) : null;
  ctx.textBaseline = 'alphabetic';

  if (s.header === 'bar') {
    const pad = px0 * 0.45;
    const barH = pad * 2 + px0 * 0.95;
    ctx.fillStyle = '#000';
    ctx.fillRect(page.x, y, page.w, barH);
    const base = y + pad + px0 * 0.8;
    const avail = page.w - pad * 2 - (date ? date.w + pad * 2 : 0);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    fit(d, name, d.nameWeight, px0, avail);
    ctx.fillText(name, page.x + pad, base);
    date?.draw(page.x + page.w - pad, base, 'right', '#fff');
    return y + barH;
  }

  if (s.header === 'tab') {
    const pad = px0 * 0.45;
    const maxText = page.w * 0.62 - pad * 2;
    const npx = fit(d, name, d.nameWeight, px0, maxText);
    const boxW = textW(d, name) + pad * 2;
    const boxH = pad * 2 + npx * 0.95;
    const x = page.x + page.w - boxW;
    const bw = lw * 2;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = bw;
    ctx.strokeRect(x + bw / 2, y + bw / 2, boxW - bw, boxH - bw);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(name, x + pad, y + pad + npx * 0.8);
    date?.draw(page.x, y + boxH - pad, 'left', '#000');
    return y + boxH;
  }

  // left / center / right: the date sits on the opposite side.
  const gap = mm(4);
  const align = nameAlign(s);
  const dw = date ? date.w + gap : 0;
  const avail = align === 'center' ? page.w - 2 * dw : page.w - dw;
  const px = fit(d, name, d.nameWeight, px0, avail);
  const base = y + px * 0.82;
  ctx.fillStyle = '#000';
  ctx.textAlign = align;
  ctx.fillText(name, xFor(page, align), base);
  if (date) {
    if (align === 'right') date.draw(page.x, base, 'left', '#000');
    else date.draw(page.x + page.w, base, 'right', '#000');
  }
  return y + px * 1.05;
}

function drawSubRow(d, page, y) {
  const { ctx, s, mm, lw, sub } = d;
  const px0 = mm(s.subSize);
  let align = s.subAlign === 'same' ? (s.header === 'none' ? 'left' : nameAlign(s)) : s.subAlign;
  const bg = s.subBg;
  const padV = bg === 'none' ? 0 : px0 * 0.4;
  const padH = bg === 'none' ? 0 : px0 * 0.6;
  const px = fit(d, sub, 400, px0, page.w - padH * 2);
  const tw = textW(d, sub);
  const h = bg === 'none' ? px * 1.1 : padV * 2 + px * 1.0;
  const base = y + padV + px * 0.8;
  let ink = gray(Math.min(d.labelShade, 70));

  if (bg === 'band' || bg === 'black') {
    ctx.fillStyle = bg === 'black' ? '#000' : gray(222);
    ctx.fillRect(page.x, y, page.w, h);
    ink = bg === 'black' ? '#fff' : '#000';
  } else if (bg === 'outline' || bg === 'tag') {
    const bw = tw + padH * 2;
    const bx = align === 'center' ? page.x + (page.w - bw) / 2 : align === 'right' ? page.x + page.w - bw : page.x;
    if (bg === 'tag') {
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, y, bw, h);
      ink = '#fff';
    } else {
      const sw = Math.max(1, lw);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = sw;
      ctx.strokeRect(bx + sw / 2, y + sw / 2, bw - sw, h - sw);
      ink = '#000';
    }
  }
  ctx.fillStyle = ink;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  setFont(d, 400, px);
  ctx.fillText(sub, xFor(page, align, padH), base);
  return y + h;
}

function drawDateRow(d, page, y) {
  const px = d.mm(d.s.dateSize);
  const f = dateField(d, px, page.w);
  const align = d.s.dateAlign || 'right';
  f.draw(xFor(page, align), y + px * 1.0, align, '#000');
  return y + px * 1.35;
}

function drawFooter(d, page) {
  const { ctx, s, mm, lw, name, o } = d;
  const px = Math.max(mm(2.6), mm(s.headerSize) * 0.42);
  const datePx = Math.min(mm(s.dateSize), px * 1.4);
  const base = page.y + page.h - px * 0.25;
  const top = base - Math.max(px, datePx) * 1.05 - mm(1.5);
  ctx.fillStyle = gray(d.labelShade);
  ctx.textBaseline = 'alphabetic';
  let leftEnd = page.x;
  let rightStart = page.x + page.w;
  if ((s.footer === 'name' || s.footer === 'both') && name) {
    ctx.textAlign = 'left';
    fit(d, name, 400, px, page.w * (d.datePos === 'footer' ? 0.4 : 0.7));
    ctx.fillText(name, page.x, base);
    leftEnd = page.x + textW(d, name);
  }
  if (s.footer === 'page' || s.footer === 'both') {
    setFont(d, 400, px);
    ctx.textAlign = 'right';
    if (o.pages) {
      const t = `${o.page || 1} / ${o.pages}`;
      ctx.fillText(t, page.x + page.w, base);
      rightStart -= textW(d, t);
    } else {
      // A slot to number the page by hand.
      const slot = px * 3;
      ctx.fillText('p.', page.x + page.w - slot - px * 0.3, base);
      ctx.fillRect(page.x + page.w - slot, Math.round(base), slot, Math.max(1, lw));
      rightStart -= slot + px * 1.3;
    }
  }
  if (d.datePos === 'footer') {
    const f = dateField(d, datePx, page.w * 0.5);
    // Centre it unless that would hit the name or page number.
    const mid = page.x + page.w / 2;
    if (mid - f.w / 2 > leftEnd + mm(3) && mid + f.w / 2 < rightStart - mm(3)) f.draw(mid, base, 'center', '#000');
    else if (leftEnd === page.x) f.draw(page.x, base, 'left', '#000');
    else f.draw(rightStart - mm(3), base, 'right', '#000');
  }
  ctx.fillStyle = gray(mix(s.lineShade, 0.3));
  ctx.fillRect(page.x, Math.round(top), page.w, Math.max(1, lw));
  return top;
}

/* ---------- watermark ---------- */

function drawWatermark(d, page) {
  const { ctx, s, W, H, mm, name } = d;
  const px0 = mm(s.watermarkSize);
  ctx.save();
  ctx.fillStyle = gray(s.watermarkShade);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const weight = d.nameWeight;

  if (s.watermark === 'center') {
    fit(d, name, weight, px0, W * 0.85);
    ctx.fillText(name, W / 2, H / 2);
  } else if (s.watermark === 'diagonal') {
    const ang = -Math.atan2(H, W);
    fit(d, name, weight, px0 * 1.4, Math.hypot(W, H) * 0.72);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(ang);
    ctx.fillText(name, 0, 0);
  } else if (s.watermark === 'tile') {
    const px = px0 * 0.5;
    setFont(d, weight, px);
    const tw = Math.max(textW(d, name), px);
    const stepX = tw + px * 2.2;
    const stepY = px * 3.4;
    const R = Math.hypot(W, H) / 2 + stepX;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    let row = 0;
    for (let y = -R; y <= R; y += stepY, row++) {
      const off = row % 2 ? stepX / 2 : 0;
      for (let x = -R + off; x <= R; x += stepX) ctx.fillText(name, x, y);
    }
  } else if (s.watermark === 'spine') {
    const margin = mm(s.marginSide);
    const px = Math.max(mm(4), Math.min(px0, margin > mm(8) ? margin * 0.7 : px0 * 0.5));
    fit(d, name, weight, px, H * 0.8);
    const x = margin > mm(8) ? margin / 2 : page.x + px * 0.7;
    ctx.translate(x, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(name, 0, 0);
  }
  ctx.restore();
}

/* ---------- patterns ---------- */

function strokeSegs(ctx, segs, width, style) {
  if (!segs.length) return;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of segs) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
}

function label(d, text, x, y, px, align = 'left') {
  const { ctx } = d;
  ctx.fillStyle = gray(d.labelShade);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  d.ctx.font = `500 ${Math.max(1, px).toFixed(1)}px ${FONTS.sans}`;
  ctx.fillText(text, x, y);
}

/** Horizontal rules every `sp`, from y0 (exclusive) to y1. */
function hRules(R, y0, y1, sp, lw) {
  const segs = [];
  for (let y = y0 + sp; y <= y1 + 0.01; y += sp) segs.push([R.x, snap(y, lw), R.x + R.w, snap(y, lw)]);
  return segs;
}

function checkbox(ctx, x, y, size, lw, style) {
  ctx.strokeStyle = style;
  ctx.lineWidth = lw;
  ctx.strokeRect(snap(x, lw), snap(y, lw), Math.round(size), Math.round(size));
}

function drawPattern(d, R) {
  const { ctx, s, mm, lw } = d;
  const sp = Math.max(mm(2), mm(s.spacing));
  const line = gray(s.lineShade);
  const faint = gray(mix(s.lineShade, 0.55));
  const dark = gray(d.labelShade);
  const thin = Math.max(1, Math.round(lw / 2));
  const lpx = Math.min(sp * 0.42, mm(3.2));

  switch (s.pattern) {
    case 'blank':
      break;

    case 'lined': {
      strokeSegs(ctx, hRules(R, R.y, R.y + R.h, sp, lw), lw, line);
      if (s.leftRule) {
        const x = snap(R.x + Math.min(mm(22), R.w * 0.2), lw);
        strokeSegs(ctx, [[x, R.y, x, R.y + R.h]], lw, dark);
      }
      break;
    }

    case 'dots':
    case 'grid':
    case 'engineering': {
      const nx = Math.floor(R.w / sp);
      const ny = Math.floor(R.h / sp);
      const ox = R.x + (R.w - nx * sp) / 2;
      const oy = R.y + (R.h - ny * sp) / 2;
      if (s.pattern === 'dots') {
        const r = Math.max(1, lw * 0.9);
        ctx.fillStyle = line;
        ctx.beginPath();
        for (let i = 0; i <= nx; i++) {
          for (let j = 0; j <= ny; j++) {
            const x = ox + i * sp, y = oy + j * sp;
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        break;
      }
      const major = s.pattern === 'engineering' ? Math.max(2, Math.round(s.majorEvery)) : 0;
      const minorSegs = [], majorSegs = [];
      for (let i = 0; i <= nx; i++) {
        const isMajor = !major || i % major === 0 || i === nx;
        const w = isMajor ? lw : thin;
        const x = snap(ox + i * sp, w);
        (isMajor ? majorSegs : minorSegs).push([x, oy, x, oy + ny * sp]);
      }
      for (let j = 0; j <= ny; j++) {
        const isMajor = !major || j % major === 0 || j === ny;
        const w = isMajor ? lw : thin;
        const y = snap(oy + j * sp, w);
        (isMajor ? majorSegs : minorSegs).push([ox, y, ox + nx * sp, y]);
      }
      strokeSegs(ctx, minorSegs, thin, faint);
      strokeSegs(ctx, majorSegs, lw, line);
      break;
    }

    case 'isometric': {
      const t = Math.tan(Math.PI / 6);
      const hx = sp * Math.cos(Math.PI / 6);
      const segs = [];
      for (let x = R.x; x <= R.x + R.w + 0.01; x += hx) segs.push([snap(x, thin), R.y, snap(x, thin), R.y + R.h]);
      const rise = R.w * t;
      for (let k = Math.floor(-rise / sp) - 1; k <= Math.ceil(R.h / sp) + 1; k++) {
        segs.push([R.x, R.y + k * sp, R.x + R.w, R.y + k * sp + rise]);
      }
      for (let k = -1; k <= Math.ceil((R.h + rise) / sp) + 1; k++) {
        segs.push([R.x, R.y + k * sp, R.x + R.w, R.y + k * sp - rise]);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(R.x, R.y, R.w, R.h);
      ctx.clip();
      strokeSegs(ctx, segs, thin, line);
      ctx.restore();
      break;
    }

    case 'cornell': {
      const sumH = Math.max(sp * 3, R.h * 0.22);
      const split = R.y + R.h - sumH;
      const cueX = snap(R.x + R.w * 0.3, lw);
      const firstLine = R.y + sp;
      label(d, 'CUES', R.x, firstLine - sp * 0.3, lpx);
      label(d, 'NOTES', cueX + lpx * 0.6, firstLine - sp * 0.3, lpx);
      strokeSegs(ctx, hRules(R, R.y + sp, split - sp * 0.5, sp, lw), lw, line);
      strokeSegs(ctx, [[cueX, R.y, cueX, split]], lw * 1.5, dark);
      const heavy = lw * 2;
      ctx.fillStyle = dark;
      ctx.fillRect(R.x, Math.round(split), R.w, heavy);
      label(d, 'SUMMARY', R.x, split + sp * 0.75, lpx);
      strokeSegs(ctx, hRules(R, split + sp * 0.5, R.y + R.h, sp, lw), lw, line);
      break;
    }

    case 'meeting': {
      const row = sp * 1.25;
      const fields = ['Date', 'Attendees', 'Purpose'];
      ctx.font = `500 ${lpx}px ${FONTS.sans}`;
      const labelW = Math.max(...fields.map((f) => textW(d, f))) + mm(3);
      const segs = [];
      fields.forEach((f, i) => {
        const y = R.y + row * (i + 1);
        label(d, f, R.x, y - row * 0.22, lpx);
        segs.push([R.x + labelW, snap(y, lw), R.x + R.w, snap(y, lw)]);
      });
      const actH = Math.max(row * 4, R.h * 0.28);
      const actTop = R.y + R.h - actH;
      const notesTop = R.y + row * fields.length + row;
      label(d, 'NOTES', R.x, notesTop - row * 0.2, lpx);
      segs.push(...hRules(R, notesTop, actTop - sp * 0.5, sp, lw));
      strokeSegs(ctx, segs, lw, line);
      ctx.fillStyle = dark;
      ctx.fillRect(R.x, Math.round(actTop), R.w, lw * 2);
      label(d, 'ACTION ITEMS', R.x, actTop + row * 0.75, lpx);
      label(d, 'OWNER', R.x + R.w, actTop + row * 0.75, lpx, 'right');
      drawChecklist(d, { x: R.x, y: actTop + row * 0.9, w: R.w, h: actH - row * 0.9 }, row, line, true);
      break;
    }

    case 'todo':
      drawChecklist(d, R, sp, line, false);
      break;

    case 'titleblock': {
      const bw = lw * 2;
      ctx.strokeStyle = dark;
      ctx.lineWidth = bw;
      ctx.strokeRect(R.x + bw / 2, R.y + bw / 2, R.w - bw, R.h - bw);
      const stripH = Math.max(mm(15), Math.min(mm(28), R.h * 0.08));
      const sy = Math.round(R.y + R.h - stripH);
      ctx.fillStyle = dark;
      ctx.fillRect(R.x, sy, R.w, bw);
      const cells = [['PROJECT', 0.52], ['SHEET', 0.16], ['DATE', 0.18], ['SCALE', 0.14]];
      let cx = R.x;
      const lp = Math.min(mm(2.4), stripH * 0.2);
      const values = {
        PROJECT: d.name,
        SHEET: d.o.pages ? `${d.o.page || 1} / ${d.o.pages}` : '',
        DATE: '',
        SCALE: '',
      };
      cells.forEach(([key, frac], i) => {
        const w = R.w * frac;
        if (i) ctx.fillRect(Math.round(cx), sy, bw, stripH);
        label(d, key, cx + lp * 0.8, sy + bw + lp * 1.3, lp);
        const v = values[key];
        if (v) {
          ctx.fillStyle = '#000';
          ctx.textAlign = 'left';
          const vpx = fit(d, v, key === 'PROJECT' ? d.nameWeight : 400, stripH * (key === 'PROJECT' ? 0.42 : 0.3), w - lp * 1.6);
          ctx.fillText(v, cx + lp * 0.8, sy + stripH - Math.max(lp * 0.8, (stripH - lp * 1.8 - vpx) / 2));
          ctx.fillStyle = dark;
        }
        cx += w;
      });
      // Light dot grid in the drawing field.
      const inset = mm(3);
      const F = { x: R.x + inset, y: R.y + inset, w: R.w - inset * 2, h: sy - R.y - inset * 2 };
      const nx = Math.floor(F.w / sp), ny = Math.floor(F.h / sp);
      if (nx > 0 && ny > 0) {
        const ox = F.x + (F.w - nx * sp) / 2, oy = F.y + (F.h - ny * sp) / 2;
        const r = Math.max(1, lw * 0.75);
        ctx.fillStyle = faint;
        ctx.beginPath();
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
          ctx.moveTo(ox + i * sp + r, oy + j * sp);
          ctx.arc(ox + i * sp, oy + j * sp, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      break;
    }
  }
}

function drawChecklist(d, R, row, style, withOwner) {
  const { ctx, mm, lw } = d;
  const box = Math.min(row * 0.5, mm(6));
  const segs = [];
  for (let y = R.y + row; y <= R.y + R.h + 0.01; y += row) {
    checkbox(ctx, R.x + mm(1), y - row * 0.18 - box, box, lw, style);
    const x0 = R.x + mm(1) + box + mm(3);
    if (withOwner) {
      const ownerX = R.x + R.w * 0.76;
      segs.push([x0, snap(y, lw), ownerX - mm(3), snap(y, lw)]);
      segs.push([ownerX, snap(y, lw), R.x + R.w, snap(y, lw)]);
    } else {
      segs.push([x0, snap(y, lw), R.x + R.w, snap(y, lw)]);
    }
  }
  strokeSegs(ctx, segs, lw, style);
}
