# ARE 5.0 Study Desk — handoff brief

Everything needed to pick this up cold and continue it as an Android app.
Written 2 November 2026. Live web version: https://claude.ai/artifact/Bz5fJekg3rL2xpUKgeS2Qm (version 3, private).

---

## 1. What this is

A single-page study tool covering all six ARE 5.0 divisions, built for a Galaxy Tab and a Boox
e-ink tablet. No build step, no framework, no dependencies. `index.html` is the whole application;
the 18 files in `data/` are content that registers itself onto globals.

Current content:

| | Count |
|---|---|
| Divisions | 6 |
| Chapters (topics) | 48 |
| Reading blocks | 208 |
| Flashcards | 693 |
| Questions | 694 |
| Case studies | 6, with 18 resource documents |
| Diagrams (inline SVG) | 13 |
| Reference sheets | 51 per-division + 23 cross-division |

Question formats: 618 multiple choice, 34 numeric entry, 25 check-all-that-apply,
13 drag-and-place, 4 hot spot.

---

## 2. Files

| File | Bytes | Holds |
|---|---|---|
| `index.html` | 84 KB | Entire app: styles, views, question engine, progress, sync |
| `data/pcm.js` | 101 KB | Practice Management — 8 topics, chapters, cards, quizzes, reference |
| `data/pjm.js` | 101 KB | Project Management |
| `data/pa.js` | 105 KB | Programming & Analysis |
| `data/ppd.js` | 125 KB | Project Planning & Design |
| `data/pdd.js` | 128 KB | Project Development & Documentation |
| `data/ce.js` | 125 KB | Construction & Evaluation |
| `data/bank-*.js` | 22–38 KB each | Division-level exam banks (6 files) |
| `data/alt.js` | 26 KB | Alternate-format items, appended to each division's bank |
| `data/hot.js` | 10 KB | Hot-spot items with their SVGs |
| `data/cases.js` | 23 KB | Case studies for PcM, PjM, PA |
| `data/cases2.js` | 33 KB | Case studies for PPD, PDD, CE (includes SVG resources) |
| `data/figures.js` | 31 KB | 13 chapter diagrams, keyed by topic id |
| `data/extras.js` | 17 KB | Cross-division reference and exam-day guidance |

**Load order matters.** Division files first, then banks, then `alt.js` and `hot.js` (which
append onto `d.exam`), then cases, then figures and extras. `index.html` has them in the
correct order; preserve it.

---

## 3. Data schema

### Division
```js
window.ARE_DATA.pcm = {
  id: "pcm", code: "PcM", name: "Practice Management",
  format: { items: 65, minutes: 160, cases: "2 case studies" },
  intro: "…",                  // markdown-lite, see §4
  sections: ["Section 1: … (23–29%)", …],
  topics: [ /* Topic */ ],
  reference: [ /* Sheet */ ],
  exam:  [ /* Question, each with .t = topic id */ ],   // added by bank-*.js, alt.js, hot.js
  cases: [ /* Case */ ]                                  // added by cases*.js
};
```

### Topic
```js
{
  id: "pcm-01", n: 1,
  section: "Section 1: Business Operations",
  title: "Business structure and personal liability",
  summary: "…",
  read:  [ /* Block */ ],
  cards: [ { q: "…", a: "…" } ],
  quiz:  [ /* Question */ ]
}
```
`topic._div` is set at boot to point back at the division. Don't serialise it.

### Block (a page of chapter reading)
Every key optional; rendered in this order:
```js
{
  h: "Heading",
  p: ["paragraph", …],
  svg: "<svg …>",            // inline figure
  caption: "…",              // caption for that svg
  ul: ["item", …],
  ol: ["item", …],
  table: { head: [...], rows: [[...], …] },
  p2: ["paragraph after the table", …],
  note: "callout text",
  noteTitle: "Exam tip"      // defaults to "Exam tip"
}
```

### Question
`k` selects the format; absent means `"mc"`.
```js
{ q, c: [4 strings], a: 0, why }                       // mc
{ k:"multi", q, c: [...], a: [0,2], why }              // check all that apply
{ k:"num",   q, a: 3.0, tol: 0.02, unit: "", why }     // tol is FRACTIONAL (0.02 = ±2%)
{ k:"hot",   q, svg: "…", a: "zoneId", why }           // svg has <g data-zone="zoneId">
{ k:"place", q, items: [...], targets: [...], a: [1,0], why }  // a[i] = item index for target i
```
Items in `exam` carry `t: "pcm-01"` to attribute results to a topic. Items in `topic.quiz`
don't need it — the topic is implied.

### Case study
```js
{
  id: "pcm-cs1", title: "…", mins: 30, scenario: "…",
  docs: [ { id: "d1", title: "…", blocks: [ /* Block */ ] } ],
  questions: [ /* Question, each with .t */ ]
}
```

### Figures
```js
window.ARE_FIGURES = {
  "ppd-01": [ { after: 0, svg: "<svg …>", caption: "…" } ]
};
```
`after` is the index of the reading block the figure follows.

### Reference sheet
```js
{ title, note, head: [...], rows: [[...]], ul: [...] }   // head/rows and ul both optional
```

### Extras
```js
window.ARE_EXTRAS = { title, blurb, groups: [ { id, title, sheets: [ /* Sheet */ ] } ] };
```

---

## 4. Markdown-lite

All display strings run through `fmt()`, which escapes HTML then converts `**bold**` and
`*italic*` only. Nothing else. No links, no code spans, no nested emphasis.

---

## 5. Progress state

One object, `prog`, persisted whole.

```js
{
  topics: {
    "pcm-01": {
      read: true,
      known: [0, 2, 5],                               // card indices recalled
      srs: { "0": { due: 1793…, int: 7, ease: 2.5, reps: 3 } },
      quizBest: 0.83, attempts: 2, conf: 4,
      ts: 1793…                                        // last touched, drives merge
    }
  },
  mocks:  { pcm: [ { ts, score, n } ] },               // newest first, capped at 30
  misses: { "pcm|q|pcm-01|3": { d, src, g, i, ts } },  // key = div|src|group|index
  cases:  { "pcm-cs1": { score, n, ts } },
  seq:    ["pcm","pjm","pa","ppd","pdd","ce"],         // user's exam order, null = default
  passed: { pcm: 1793… },                              // divisions marked passed
  settings: { eink: false, theme: "system", size: 1 }
}
```

- `localStorage` key `are5.progress.v3`, falling back to reading `…v2` once.
- Miss keys: `src` is `q` (topic quiz), `e` (exam bank) or `c` (case study); `g` is the
  topic id, `-`, or the case id respectively.
- Merge is per-topic last-write-wins on `ts`. Mocks merge by `ts` dedupe. `passed` and
  `misses` are additive. `seq` only fills if locally unset.

### Readiness scoring
Per topic, out of 100: read 25, cards 25 × (known / total), quiz 35 × best score,
confidence 15 × (rating / 5). Division readiness is the mean of its topics; overall is the
mean of the six divisions.

A division reads **Ready to schedule** when readiness ≥ 85 **and** best full-length mock ≥ 0.75,
where "full-length" means an attempt with `n ≥ 0.9 × format.items`.

### Spaced repetition
SM-2 lite in `schedule()`. Grades 0–3 (Again / Hard / Good / Easy). First rep: Again → 10 min,
Hard/Good → 1 day, Easy → 3 days. Then intervals multiply by 1.2 / ease / ease × 1.35, with
ease clamped to 1.3–3.0. Grade ≥ 2 adds the card to `known`; grade 0 removes it.

---

## 6. Design decisions, and why

- **No framework, no build.** The whole point was a file that opens on an e-ink tablet with
  no toolchain. Keep it that way unless something forces otherwise.
- **E-ink mode is a third theme axis**, not a dark-mode variant. `:root[data-eink="on"]`
  overrides every token to pure black on white with no greys and thicker rules, and it is
  declared *after* both theme blocks so it wins. All 13 SVGs draw from the same tokens, so
  they survive it.
- **Zero transitions and animations**, globally forced. E-ink ghosts.
- **Chapters paginate one block per page** rather than scrolling. E-ink scroll is unpleasant,
  and a page turn is one clean repaint.
- **Drag-and-place is tap-to-assign.** Tap an item, tap its destination. Dragging on a touch
  screen is bad and on e-ink it is unusable. The assessment is identical.
- **Numeric answers accept a fractional tolerance.** More forgiving on rounding than the real
  exam. Deliberate, but worth revisiting.
- **Mock pools carry ~20% headroom** over each division's item count, so repeat full-length
  attempts aren't identical.
- **Audio flashcard drill (not yet built) should not touch SRS intervals** — there's no honest
  recall signal without input.

---

## 7. Content caveats — carry these forward

1. **Item counts and timings are from secondary sources.** NCARB's own Guidelines were not
   reachable; published summaries conflict. The figures used (PcM 65/2h40, PjM 75/3h,
   PA 75/3h, PPD 100/4h05, PDD 100/4h05, CE 75/3h) are the set two independent sources agree
   on. The app says so in each division's About tab. Verify before relying on them.
2. **The April 2026 NCARB update changed 12 of the 91 objectives.** Content was written against
   the objectives as understood; anything borderline needs checking against ncarb.org.
3. **NCARB does not mandate a division order.** The default sequence is NCARB's own listing
   order. The app states this rather than implying a requirement.
4. **The 75% mock threshold is invented.** NCARB scores against a criterion-referenced
   standard and publishes no percentage. It is a working signal, not a pass mark.
5. All content is a study aid, not a substitute for the AIA documents or the adopted code.

---

## 8. What breaks outside the claude.ai artifact viewer

Porting to a WebView app or a standalone file:

- **`claude.use("db")` returns null.** Cross-device sync dies. The code already guards this
  with try/catch and degrades to localStorage only, so nothing crashes — but sync needs
  replacing. Options: a JSON file on the device synced by Syncthing, a private gist, or
  WebDAV. The merge logic in `mergeRemote()` is transport-agnostic and can be reused as-is.
- **No publish skeleton.** The artifact platform injects `<!doctype html>`, a charset meta,
  `<meta name="viewport" … viewport-fit=cover>` and a small reset. A standalone file has none
  of it. You must add the doctype, both metas, `body{margin:0}`, `img{max-width:100%}` and
  **`[hidden]{display:none!important}`** — the code toggles the back button with `el.hidden`
  and relies on that rule.
- **Google Fonts needs network.** `index.html` links Spectral, IBM Plex Sans and IBM Plex Mono.
  For offline, bundle the woff2 files locally or drop the link — the fallback stacks
  (Georgia / system-ui / monospace) are already declared and legible.
- **Downloads and clipboard are sandbox-restricted in the artifact, not in a WebView.** The
  manual progress export/import textarea exists because `<a download>` is inert in the
  viewer. In a native app you can write real files, so that UI can be replaced with a proper
  export.

### What the native app unlocks
Both open problems become solvable:
- **Offline** — bundle `index.html` and `data/` as app assets.
- **Background audio** — Android's `TextToSpeech` keeps playing with the screen off, which
  browser `speechSynthesis` does not. See §9.

---

## 9. Open work

1. **Audio narration.** Agreed scope: chapter listen-along with auto-advance, and a hands-free
   flashcard drill (prompt → gap → answer → gap → next). Not quizzes, case studies, reference
   tables or diagrams — wrong medium for all four. The real work is a pronunciation
   normalisation layer, roughly 80 rules: `B101` → "bee one oh one", `§2.2` → "section two
   point two", `psf`/`gsf`/`STC`/`AHJ`/`GMP` expanded, `1½ hr` → "one and a half hour",
   `16–18″` → "sixteen to eighteen inches", `1:12` → "one in twelve", `Type V-B` → "type five
   bee", `Group I-2` → "group eye two", `±10–15%` → "plus or minus ten to fifteen percent".
   Content files stay untouched; the audio layer derives speech text from the same data.
   A listened chapter should mark itself read like a scrolled one.
   **Done in the Android app:** `speech.js` holds the normaliser (checked against every chapter and
   card by `npm test`), the chapter listen-along and the hands-free drill; the native `Narrator`
   plugin plays it from a foreground service so it continues with the screen off.
2. **Offline packaging.**
3. **More case studies.** One per division is thin; PPD and PDD carry more on the real exam.
4. **Hot-spot coverage is light** — only 4 items, because each needs a hand-drawn SVG.
5. **Numeric tolerance** may be too forgiving.

---

## 10. Verification

There is no test suite. Validation was done with throwaway Node scripts that:

- `eval` each data file against a stubbed `window`, catching parse errors
- walk every question and check: stem and explanation present, `mc` answer index in range,
  `multi` answers in range and non-empty, `num` answer numeric, `hot` answer zone actually
  present in its SVG string, `place` answer length matching targets with no duplicates
- confirm every `exam` item's `t` resolves to a real topic id
- confirm each division's pool ≥ its full-length item count
- confirm figure `after` indices are within the topic's block count
- syntax-check the inline page script with `new Function()`

Worth reinstating as real tests in the new repo — the SVG zone check and the pool-size check
both caught genuine mistakes.
