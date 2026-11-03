// Checks for the Template Maker tool (public/tools/templates/).
// Renders every pattern × name placement against a recording mock canvas and checks that
// nothing throws, every coordinate is a finite number, and the notebook name actually lands
// on the page. Then builds a small PDF and checks its structure and xref offsets.
import { render, PATTERNS, HEADERS, WATERMARKS, FOOTERS, DATES, DEFAULTS, usesPageNumbers, safeFileName, resolveText } from '../public/tools/templates/render.js';
import { buildPdf } from '../public/tools/templates/pdf.js';

let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };

function mockCtx(W, H) {
  const texts = [];
  let bad = null;
  const check = (name, args) => {
    for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) bad ??= `${name}(${args.join(', ')})`;
  };
  const ctx = {
    texts, get bad() { return bad; },
    font: '10px sans', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1,
    measureText(t) { const px = parseFloat(/([\d.]+)px/.exec(this.font)?.[1] || 10); return { width: String(t).length * px * 0.55 }; },
    fillText(t, x, y) { check('fillText', [x, y]); texts.push(String(t)); },
  };
  for (const m of ['save', 'restore', 'beginPath', 'stroke', 'fill', 'clip', 'closePath']) ctx[m] = () => {};
  for (const m of ['fillRect', 'strokeRect', 'moveTo', 'lineTo', 'arc', 'rect', 'translate', 'rotate', 'setTransform', 'scale']) {
    ctx[m] = (...a) => check(m, a);
  }
  return ctx;
}

const sizes = [
  { W: 1860, H: 2480, ppi: 300 },
  { W: 2480, H: 1860, ppi: 300 }, // landscape
  { W: 1404, H: 1872, ppi: 227 },
  { W: 186, H: 248, ppi: 30 }, // preview scale
];
const NAME = 'Riverside Library — Site Visits';
let renders = 0;

for (const [pattern] of PATTERNS) {
  for (const [header] of HEADERS) {
    for (const [watermark] of WATERMARKS) {
      for (const [footer] of FOOTERS) {
        for (const sz of sizes) {
          const s = { name: NAME, subtitle: 'Job {year} · p{page}', pattern, header, watermark, footer, date: DATES[renders % DATES.length][0], leftRule: true };
          const ctx = mockCtx(sz.W, sz.H);
          try {
            render(ctx, sz.W, sz.H, s, { ppi: sz.ppi, page: 2, pages: 10, date: 'Nov 3, 2026', year: '2026' });
          } catch (e) {
            fail(`${pattern}/${header}/${watermark}/${footer} @${sz.W}x${sz.H} threw: ${e.message}`);
            continue;
          }
          renders++;
          if (ctx.bad) fail(`${pattern}/${header}/${watermark}/${footer} @${sz.W}x${sz.H}: non-finite ${ctx.bad}`);
          const nameShown = header !== 'none' || watermark !== 'none' || footer === 'name' || footer === 'both' || pattern === 'titleblock';
          if (nameShown && !ctx.texts.includes(NAME)) fail(`${pattern}/${header}/${watermark}/${footer}: name not drawn`);
          if (ctx.texts.some((t) => /\{|\}|undefined|NaN/.test(t))) fail(`${pattern}/${header}: unresolved text ${JSON.stringify(ctx.texts)}`);
        }
      }
    }
  }
}

// Extreme settings must not throw either.
for (const extra of [{ marginTop: 40, marginSide: 40, marginBottom: 40, headerSize: 25 }, { marginTop: 0, marginSide: 0, marginBottom: 0, spacing: 3 }, { name: '' }, { name: '   ' }]) {
  for (const [pattern] of PATTERNS) {
    const ctx = mockCtx(800, 600);
    try { render(ctx, 800, 600, { ...extra, pattern, watermark: 'tile', footer: 'both' }, { ppi: 100 }); } catch (e) { fail(`extreme ${JSON.stringify(extra)} ${pattern}: ${e.message}`); }
    if (ctx.bad) fail(`extreme ${JSON.stringify(extra)} ${pattern}: non-finite ${ctx.bad}`);
  }
}

// Helpers
if (safeFileName('a/b:c*?"<>|d') !== 'a b c d') fail(`safeFileName: ${safeFileName('a/b:c*?"<>|d')}`);
if (safeFileName('...') !== 'Template') fail('safeFileName should fall back to Template');
if (resolveText('{name} {page}/{pages} {date}', { name: 'N', page: 3, pages: 9, date: 'D' }) !== 'N 3/9 D') fail('resolveText tokens');
if (usesPageNumbers({ ...DEFAULTS, footer: 'none', pattern: 'lined' })) fail('usesPageNumbers false positive');
if (!usesPageNumbers({ footer: 'page' })) fail('usesPageNumbers false negative');

// PDF: 3 pages, two sharing one image.
const w = 40, h = 30;
const pdf = await buildPdf({
  count: 3, width: w, height: h, ppi: 10, title: 'Test (π)',
  getPage: async (i) => ({ key: i === 2 ? 'b' : 'a', gray: new Uint8Array(w * h).fill(i === 2 ? 0 : 255) }),
});
const text = new TextDecoder('latin1').decode(pdf);
if (!text.startsWith('%PDF-1.4')) fail('PDF header');
if (!text.trimEnd().endsWith('%%EOF')) fail('PDF trailer');
if ((text.match(/\/Subtype \/Image/g) || []).length !== 2) fail('PDF should hold 2 images for 3 pages');
if (!/\/Count 3\b/.test(text)) fail('PDF page count');
const startxref = Number(/startxref\n(\d+)/.exec(text)?.[1]);
if (!text.startsWith('xref', startxref)) fail('startxref offset');
const entries = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
entries.forEach((off, i) => { if (!text.startsWith(`${i + 1} 0 obj`, off)) fail(`xref entry ${i + 1} points at the wrong offset`); });

if (failures) {
  console.error(`Template Maker: ${failures} problem(s).`);
  process.exit(1);
}
console.log(`Template Maker: ${renders} renders and the PDF writer check out.`);
