// Validates ARE Prep Tools content before every build (npm test, run by CI).
// Loads the data files in the same order index.html does, against a stubbed
// window, then checks every question, figure and pool. Exits 1 on any error.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'tools', 'are');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Load data files in the order the page loads them.
const order = [...html.matchAll(/<script src="(data\/[^"]+\.js)"><\/script>/g)].map((m) => m[1]);
if (!order.length) fail('index.html lists no data scripts');
const ctx = { window: { ARE_DATA: {}, ARE_FIGURES: {}, ARE_EXTRAS: null } };
vm.createContext(ctx);
for (const rel of order) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { fail(`${rel}: missing`); continue; }
  try { vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: rel }); }
  catch (e) { fail(`${rel}: ${e.message}`); }
}
const listed = new Set(order.map((r) => path.basename(r)));
for (const f of fs.readdirSync(path.join(root, 'data'))) if (!listed.has(f)) fail(`data/${f} is not loaded by index.html`);

// 2. The inline app script must at least parse.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((src, i) => { try { new Function(src); } catch (e) { fail(`inline script ${i}: ${e.message}`); } });

// 3. Content checks.
const { ARE_DATA, ARE_FIGURES, ARE_EXTRAS } = ctx.window;
const DIVS = ['pcm', 'pjm', 'pa', 'ppd', 'pdd', 'ce'];
const kinds = {};
let nQ = 0, nCards = 0, nTopics = 0;

function checkQuestion(q, where, topicIds) {
  nQ++;
  const k = q.k || 'mc';
  kinds[k] = (kinds[k] || 0) + 1;
  if (!q.q || !String(q.q).trim()) fail(`${where}: empty stem`);
  if (!q.why || !String(q.why).trim()) fail(`${where}: missing explanation`);
  if (topicIds && !topicIds.has(q.t)) fail(`${where}: topic "${q.t}" does not exist`);
  const inRange = (i, n) => Number.isInteger(i) && i >= 0 && i < n;
  if (k === 'mc') {
    if (!Array.isArray(q.c) || q.c.length < 2) fail(`${where}: mc needs choices`);
    else if (!inRange(q.a, q.c.length)) fail(`${where}: mc answer ${q.a} out of range`);
    else if (new Set(q.c).size !== q.c.length) fail(`${where}: duplicate choices`);
  } else if (k === 'multi') {
    if (!Array.isArray(q.a) || !q.a.length) fail(`${where}: multi answer empty`);
    else if (q.a.some((i) => !inRange(i, q.c.length))) fail(`${where}: multi answer out of range`);
    else if (new Set(q.a).size !== q.a.length) fail(`${where}: multi answer has duplicates`);
  } else if (k === 'num') {
    if (typeof q.a !== 'number' || !isFinite(q.a)) fail(`${where}: num answer not numeric`);
    if (q.tol != null && !(q.tol >= 0 && q.tol < 1)) fail(`${where}: tol should be a fraction`);
  } else if (k === 'hot') {
    const zones = [...String(q.svg || '').matchAll(/data-zone="([^"]+)"/g)].map((m) => m[1]);
    if (zones.length < 2) fail(`${where}: hot needs at least two zones`);
    if (!zones.includes(q.a)) fail(`${where}: hot answer "${q.a}" is not a zone in the SVG`);
  } else if (k === 'place') {
    if (!Array.isArray(q.a) || q.a.length !== (q.targets || []).length) fail(`${where}: place answer length ≠ targets`);
    else if (q.a.some((i) => !inRange(i, q.items.length))) fail(`${where}: place answer out of range`);
    else if (new Set(q.a).size !== q.a.length) fail(`${where}: place answer reuses an item`);
  } else fail(`${where}: unknown kind "${k}"`);
}

for (const id of DIVS) {
  const d = ARE_DATA[id];
  if (!d) { fail(`division ${id} missing`); continue; }
  const topicIds = new Set(d.topics.map((t) => t.id));
  if (topicIds.size !== d.topics.length) fail(`${id}: duplicate topic ids`);
  d.topics.forEach((t) => {
    nTopics++; nCards += (t.cards || []).length;
    if (!(t.read || []).length) fail(`${t.id}: no reading`);
    (t.cards || []).forEach((c, i) => { if (!c.q || !c.a) fail(`${t.id} card ${i}: empty side`); });
    (t.quiz || []).forEach((q, i) => checkQuestion(q, `${t.id} quiz ${i}`, null));
  });
  (d.exam || []).forEach((q, i) => checkQuestion(q, `${id} exam ${i}`, topicIds));
  (d.cases || []).forEach((cs) => {
    if (!(cs.docs || []).length) fail(`${cs.id}: no documents`);
    cs.questions.forEach((q, i) => checkQuestion(q, `${cs.id} q${i}`, topicIds));
  });
  // Pool must cover a full-length mock.
  const pool = d.topics.reduce((n, t) => n + (t.quiz || []).length, 0) + (d.exam || []).length;
  if (pool < d.format.items) fail(`${id}: pool ${pool} < full-length ${d.format.items}`);
}

for (const [tid, figs] of Object.entries(ARE_FIGURES || {})) {
  const t = DIVS.flatMap((id) => ARE_DATA[id]?.topics || []).find((x) => x.id === tid);
  if (!t) { fail(`figure for unknown topic ${tid}`); continue; }
  figs.forEach((f, i) => {
    if (!(f.after >= 0 && f.after < t.read.length)) fail(`figure ${tid}[${i}]: after=${f.after} out of range`);
    if (!/^<svg[\s>]/.test(f.svg)) fail(`figure ${tid}[${i}]: not an SVG`);
  });
}
if (!ARE_EXTRAS || !(ARE_EXTRAS.groups || []).length) fail('extras missing');

// 4. Narration: the pronunciation layer turns every chapter and card into plain words.
const sp = { window: {} };
vm.createContext(sp);
try { vm.runInContext(fs.readFileSync(path.join(root, 'speech.js'), 'utf8'), sp, { filename: 'speech.js' }); }
catch (e) { fail(`speech.js: ${e.message}`); }
const SP = sp.window.ARE_SPEECH;
if (!/<script src="speech\.js"><\/script>/.test(html)) fail('index.html does not load speech.js');
let nSpoken = 0;
if (SP) {
  const cases = [
    ['B101', 'bee one oh one'], ['§2.2', 'section two point two'], ['50 psf', 'fifty pounds per square foot'],
    ['80,000 gsf', 'eighty thousand gross square feet'], ['STC 50', 'sound transmission class fifty'],
    ['the AHJ', 'the authority having jurisdiction'], ['a GMP', 'a guaranteed maximum price'],
    ['1½ hr', 'one and a half hour'], ['16–18″', 'sixteen to eighteen inches'], ['1:12', 'one in twelve'],
    ['Type V-B', 'type five bee'], ['Group I-2', 'group eye two'], ['±10–15%', 'plus or minus ten to fifteen percent'],
    ['$4,987,500', 'four million nine hundred eighty-seven thousand five hundred dollars'],
    ['A-301', 'ay three oh one'], ['R-13', 'ar thirteen'], ['3/4" = 1\'-0"', 'three quarter inch equals one foot'],
    ['Title VII', 'title seven'], ['1978', 'nineteen seventy-eight'], ['90° − latitude', 'ninety degrees minus latitude'],
    ['RFIs', 'ar ef eyes'], ['WILL NOT', 'will not'], ['1:48', 'one in forty-eight'], ['§8.1.3', 'section eight point one point three'],
  ];
  for (const [src, want] of cases) {
    const got = SP.speak(src).toLowerCase();
    if (got !== want) fail(`speech: "${src}" → "${got}", expected "${want}"`);
  }
  // Nothing a voice would stumble on may survive: digits, symbols, or unexpanded capitals.
  const leftover = /[0-9%$§±°×÷=\/"″′<>*_#|\[\]{}→—–½¼¾⅓⅔⅛⅜⅝⅞]|\b[A-Z]{2,}\b/;
  for (const id of DIVS) for (const t of ARE_DATA[id]?.topics || []) {
    const items = SP.chapterItems(t).concat(SP.cardItems(t.cards || [], 5000));
    for (const it of items) {
      nSpoken++;
      const m = it.text.match(leftover);
      if (m) fail(`speech ${t.id}: "${m[0]}" left in "…${it.text.slice(Math.max(0, m.index - 40), m.index + 30)}…"`);
      if (it.text.length > 3600) fail(`speech ${t.id}: item over the TTS input limit`);
    }
  }
}

// 5. Offline: nothing in the page may reach the network.
if (/https?:\/\/(fonts\.googleapis|fonts\.gstatic)/.test(html)) fail('index.html still loads Google Fonts');
for (const m of html.matchAll(/url\((fonts\/[^)]+)\)/g)) if (!fs.existsSync(path.join(root, m[1]))) fail(`font missing: ${m[1]}`);

console.log(`ARE content: ${DIVS.length} divisions, ${nTopics} topics, ${nCards} cards, ${nQ} questions`,
  Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', '));
console.log(`Narration: ${SP ? SP.rules : 0} pronunciation rules, ${nSpoken} spoken items checked`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('All checks passed.');
