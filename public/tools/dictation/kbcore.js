// Shared logic for Aside Transcribe recordings: formatting, flags (possible mishearings), edits and
// Claude request/response handling. Used by the keyboard (keyboard.js), the app page (app.js) and
// scripts/validate-dictation.mjs. No DOM access here.
//
// Recording: { v:2, id, title, created, updated, pushed, summary, nextPid,
//              phrases:[{ id, raw, alts:[], conf, end, br, fixed, kept:[] }],
//              flags:[{ id, p, ws, we, sugg:[], reason, src:"alt"|"ai" }] }
//   raw   = text as heard (or edited); words are split on whitespace.
//   end   = punctuation chosen by the user for the end of the phrase (null = automatic).
//   br    = phrase starts a new paragraph.
//   fixed = text edited by hand; shown exactly as written.
//   spk   = a speaker turn starts at this phrase: "A", "B", … or "?" (unknown, from the bubble).
//           The speaker carries on until the next phrase with spk. Names live in rec.speakers
//           ({ A: "Moderator" }); the first turn is speaker A unless a phrase says otherwise.
//   flags with kind "spk" are speaker questions: an unknown turn (unknown: true) or a place
//           where Claude thinks a new person starts talking (ws = first word of the new turn).
//   flags point at words ws..we-1 of phrase p.
(function (root) {
  'use strict';

  const END_PUNCT = /[.?!,;:…]$/;
  const SENT_END = /[.?!…]["'”’)\]]*$/;

  const words = (s) => String(s == null ? '' : s).trim().split(/\s+/).filter(Boolean);
  const norm = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '');
  const capFirst = (w) => w.replace(/^(["'“‘(\[]*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());

  function newRecording(now) {
    now = now || Date.now();
    return {
      v: 2,
      id: 'r' + now.toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, '0'),
      title: '', created: now, updated: now, pushed: 0, summary: '', nextPid: 1,
      phrases: [], flags: [],
    };
  }

  function defaultTitle(rec) {
    const d = new Date(rec.created || Date.now());
    const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return 'Recording · ' + day + ', ' + time;
  }
  const titleOf = (rec) => (rec && rec.title) || defaultTitle(rec || {});

  /** Formats phrases: sentence capitals, a period at each pause (unless the phrase already ends
   *  in punctuation or the user chose one), single spaces between phrases, new lines for breaks. */
  function render(rec, opts) {
    opts = opts || {};
    const cap = opts.cap !== false;
    const autoPeriod = opts.autoPeriod !== false;
    const out = [];
    let prevSent = true;
    let cur = null;
    for (const p of (rec && rec.phrases) || []) {
      const ws = words(p.raw);
      if (!ws.length) continue;
      // A turn starts at the first phrase, and wherever a phrase names a different speaker.
      let spk = null;
      if (cur === null) { cur = p.spk || 'A'; spk = cur; }
      else if (p.spk && (p.spk !== cur || p.spk === '?')) { cur = p.spk; spk = cur; }
      if (!p.fixed) {
        if (cap && (prevSent || p.br || (spk && out.length))) ws[0] = capFirst(ws[0]);
        let last = ws[ws.length - 1];
        if (p.end != null) last = last.replace(/[.?!,;:…]+$/, '') + p.end;
        else if (autoPeriod && !END_PUNCT.test(last)) last += '.';
        ws[ws.length - 1] = last;
      }
      const text = ws.join(' ');
      out.push({ p, words: ws, sep: out.length === 0 ? '' : (p.br || spk ? '\n' : ' '), text, spk });
      prevSent = SENT_END.test(text);
    }
    return out;
  }

  const plain = (rec, opts) => render(rec, opts).map((r) => r.sep + r.text).join('');
  const wordCount = (rec) => ((rec && rec.phrases) || []).reduce((n, p) => n + words(p.raw).length, 0);
  const phraseById = (rec, id) => rec.phrases.find((p) => p.id === id);

  function addPhrase(rec, heard, pending) {
    const text = String((heard && heard.text) || '').trim();
    if (!text) return null;
    const p = {
      id: rec.nextPid++,
      raw: text,
      alts: ((heard.alts || []).map((a) => String(a || '').trim()).filter((a) => a && a !== text)).slice(0, 4),
      conf: typeof heard.conf === 'number' ? heard.conf : -1,
      end: pending && pending.end != null ? pending.end : null,
      br: !!(pending && pending.br && rec.phrases.length),
    };
    if (pending && pending.spk) p.spk = pending.spk;
    rec.phrases.push(p);
    rec.updated = Date.now();
    return p;
  }

  // ---------------------------------------------------------------- flags

  function overlaps(a, b) { return a.p === b.p && a.ws < b.we && b.ws < a.we; }

  function addFlag(rec, f) {
    const p = phraseById(rec, f.p);
    if (!p || f.we <= f.ws) return false;
    const key = words(p.raw).slice(f.ws, f.we).map(norm).join(' ');
    if ((p.kept || []).includes(key)) return false;
    const sugg = (f.sugg || []).map((s) => String(s).trim()).filter((s) => s && norm(s) !== key.replace(/ /g, '') && s.toLowerCase() !== key);
    const existing = rec.flags.find((g) => g.kind !== 'spk' && overlaps(g, f));
    if (existing) {
      for (const s of sugg) if (!existing.sugg.some((t) => t.toLowerCase() === s.toLowerCase())) {
        if (f.src === 'ai') existing.sugg.unshift(s); else existing.sugg.push(s);
      }
      existing.sugg = existing.sugg.slice(0, 4);
      if (f.src === 'ai' && f.reason) { existing.reason = f.reason; existing.src = 'ai'; }
      return false;
    }
    rec.flags.push({ id: 'f' + Math.random().toString(36).slice(2, 8), p: f.p, ws: f.ws, we: f.we, sugg: sugg.slice(0, 4), reason: f.reason || '', src: f.src || 'alt' });
    return true;
  }

  /** Words where the recogniser's own alternatives disagree with what it picked. */
  function altFlags(p) {
    const top = words(p.raw);
    const T = top.map(norm);
    const found = [];
    for (const alt of p.alts || []) {
      const A = words(alt);
      const An = A.map(norm);
      const n = T.length, m = An.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = T[i] === An[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
      let i = 0, j = 0, gi = 0, gj = 0;
      const flush = (a, b, c, d) => {
        if (b > a) found.push({ p: p.id, ws: a, we: b, sugg: [A.slice(c, d).join(' ')].filter(Boolean), reason: 'Recogniser was unsure', src: 'alt' });
      };
      while (i < n && j < m) {
        if (T[i] === An[j]) { flush(gi, i, gj, j); i++; j++; gi = i; gj = j; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
        else j++;
      }
      flush(gi, n, gj, m);
    }
    return found.filter((f) => f.sugg.length);
  }

  function findRange(p, quote) {
    const Q = words(quote).map(norm).filter(Boolean);
    const T = words(p.raw).map(norm);
    if (!Q.length) return null;
    for (let i = 0; i + Q.length <= T.length; i++) {
      let ok = true;
      for (let k = 0; k < Q.length; k++) if (T[i + k] !== Q[k]) { ok = false; break; }
      if (ok) return [i, i + Q.length];
    }
    return null;
  }

  function sortFlags(rec) {
    const order = new Map(rec.phrases.map((p, i) => [p.id, i]));
    rec.flags = rec.flags.filter((f) => order.has(f.p));
    rec.flags.sort((a, b) => (order.get(a.p) - order.get(b.p)) || (a.ws - b.ws));
  }

  function localCheck(rec) {
    rec.flags = rec.flags.filter((f) => f.src === 'ai' || f.src === 'spk-ai' || (f.src === 'unk' && f.sugg && f.sugg.length));
    let n = 0;
    for (const p of rec.phrases) for (const f of altFlags(p)) if (addFlag(rec, f)) n++;
    unknownTurnFlags(rec);
    sortFlags(rec);
    return n;
  }

  // ---------------------------------------------------------------- edits

  /** Replace words ws..we-1 of a phrase (keeps the punctuation around them). '' deletes. */
  function replaceWords(rec, pid, ws, we, replacement) {
    const p = phraseById(rec, pid);
    if (!p) return;
    const W = words(p.raw);
    if (ws < 0 || we > W.length || we <= ws) return;
    let R = words(replacement);
    if (R.length) {
      const lead = (W[ws].match(/^[^\p{L}\p{N}]+/u) || [''])[0];
      const trail = (W[we - 1].match(/[^\p{L}\p{N}]+$/u) || [''])[0];
      if (lead && !R[0].startsWith(lead)) R[0] = lead + R[0];
      if (trail && !R[R.length - 1].endsWith(trail)) R[R.length - 1] += trail;
    }
    const delta = R.length - (we - ws);
    p.raw = W.slice(0, ws).concat(R, W.slice(we)).join(' ');
    p.alts = [];
    rec.flags = rec.flags.filter((f) => {
      if (f.p !== pid) return true;
      if (f.ws >= we) { f.ws += delta; f.we += delta; return true; }
      return f.we <= ws;
    });
    if (!words(p.raw).length) deletePhrase(rec, pid);
    rec.updated = Date.now();
  }

  function applyFlag(rec, flag, replacement) { replaceWords(rec, flag.p, flag.ws, flag.we, replacement); }

  function keepFlag(rec, flag) {
    const p = phraseById(rec, flag.p);
    if (p) {
      p.kept = p.kept || [];
      p.kept.push(words(p.raw).slice(flag.ws, flag.we).map(norm).join(' '));
    }
    rec.flags = rec.flags.filter((f) => f !== flag && f.id !== flag.id);
    rec.updated = Date.now();
  }

  function deletePhrase(rec, pid) {
    rec.phrases = rec.phrases.filter((p) => p.id !== pid);
    rec.flags = rec.flags.filter((f) => f.p !== pid);
    rec.updated = Date.now();
  }

  function deleteLastWord(rec) {
    const p = rec.phrases[rec.phrases.length - 1];
    if (!p) return;
    const W = words(p.raw);
    replaceWords(rec, p.id, W.length - 1, W.length, '');
  }

  /** Text edited by hand in the app replaces the phrases with one fixed block. */
  function setEditedText(rec, text) {
    const t = String(text || '').replace(/\r/g, '').trim();
    rec.phrases = t ? [{ id: rec.nextPid++, raw: t, alts: [], conf: -1, end: null, br: false, fixed: true }] : [];
    rec.flags = [];
    rec.updated = Date.now();
  }

  // fixed phrases keep their own line breaks; words() would collapse them.
  function renderFixedAware(rec, opts) {
    const labels = usesLabels(rec);
    return render(rec, opts).map((r) => r.sep + (labels && r.spk ? speakerName(rec, r.spk) + ': ' : '') +
      (r.p.fixed ? String(r.p.raw).trim() : r.text)).join('');
  }

  // ---------------------------------------------------------------- speakers

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /** Speaker ids in order of appearance (A first), including declared ones not yet used. */
  function speakerIds(rec) {
    const seen = [];
    const add = (x) => { if (x && x !== '?' && !seen.includes(x)) seen.push(x); };
    const first = rec.phrases.find((p) => words(p.raw).length);
    add((first && first.spk && first.spk !== '?') ? first.spk : 'A');
    rec.phrases.forEach((p) => add(p.spk));
    Object.keys(rec.speakers || {}).forEach(add);
    return seen;
  }

  /** Labels appear once a second speaker (or an unknown turn) is in the text. */
  function usesLabels(rec) {
    const turns = new Set(render(rec, { autoPeriod: false, cap: false }).filter((r) => r.spk).map((r) => r.spk));
    return turns.size > 1 || turns.has('?');
  }

  const speakerName = (rec, id) => id === '?' ? 'Unknown speaker' : ((rec.speakers && rec.speakers[id]) || 'Speaker ' + id);
  const speakerTag = (rec, id) => id === '?' ? '?' : ((rec.speakers && rec.speakers[id]) || id);

  function newSpeakerId(rec) {
    const used = speakerIds(rec);
    return LETTERS.split('').find((l) => !used.includes(l)) || ('S' + (used.length + 1));
  }

  function declareSpeaker(rec, id) {
    rec.speakers = rec.speakers || {};
    if (id && id !== '?' && !(id in rec.speakers)) rec.speakers[id] = '';
    return id;
  }

  function renameSpeaker(rec, id, name) {
    declareSpeaker(rec, id);
    rec.speakers[id] = String(name || '').trim();
    rec.updated = Date.now();
  }

  /** The speaker talking at the end of the text. */
  function currentSpeaker(rec) {
    const rows = render(rec, { autoPeriod: false, cap: false });
    let cur = 'A';
    rows.forEach((r) => { if (r.spk) cur = r.spk; });
    return cur;
  }

  /** A new speaker starts at word i of phrase pid (splitting the phrase when i > 0). */
  function splitTurn(rec, pid, i, spk) {
    const idx = rec.phrases.findIndex((p) => p.id === pid);
    if (idx < 0) return null;
    declareSpeaker(rec, spk);
    const p = rec.phrases[idx];
    const W = words(p.raw);
    if (i <= 0 || i >= W.length) { p.spk = spk; p.br = false; rec.updated = Date.now(); return p; }
    const tail = { id: rec.nextPid++, raw: W.slice(i).join(' '), alts: [], conf: -1, end: p.end, br: false, spk };
    p.raw = W.slice(0, i).join(' ');
    p.end = null;
    p.alts = [];
    rec.flags = rec.flags.filter((f) => {
      if (f.p !== pid) return true;
      if (f.we <= i && !(f.kind === 'spk' && f.ws === i)) return true;
      if (f.ws >= i) { f.p = tail.id; f.ws -= i; f.we -= i; return !(f.kind === 'spk' && f.ws === 0); }
      return false;
    });
    rec.phrases.splice(idx + 1, 0, tail);
    rec.updated = Date.now();
    return tail;
  }

  /** "Not a change": the turn joins the previous speaker. */
  function clearTurn(rec, pid) {
    const p = phraseById(rec, pid);
    if (p) { delete p.spk; rec.updated = Date.now(); }
  }

  function unknownTurnFlags(rec) {
    for (const p of rec.phrases) {
      if (p.spk !== '?' || !words(p.raw).length) continue;
      if (rec.flags.some((f) => f.kind === 'spk' && f.p === p.id && f.ws === 0)) continue;
      rec.flags.push({ id: 'f' + Math.random().toString(36).slice(2, 8), kind: 'spk', unknown: true, p: p.id, ws: 0, we: 1, sugg: [], reason: 'Marked from the bubble', src: 'unk' });
    }
  }

  /** Answer a speaker question: who starts talking here (an id, or "new"). */
  function resolveSpeakerFlag(rec, flag, id) {
    if (id === 'new') id = newSpeakerId(rec);
    declareSpeaker(rec, id);
    if (flag.unknown) { const p = phraseById(rec, flag.p); if (p) p.spk = id; }
    else splitTurn(rec, flag.p, flag.ws, id);
    rec.flags = rec.flags.filter((f) => f.id !== flag.id);
    rec.updated = Date.now();
    return id;
  }

  function dismissSpeakerFlag(rec, flag) {
    if (flag.unknown) clearTurn(rec, flag.p);
    rec.flags = rec.flags.filter((f) => f.id !== flag.id);
    rec.updated = Date.now();
  }

  function speakerRequest(rec, opts, ctx) {
    const ids = speakerIds(rec);
    const lines = render(rec, opts).map((r) => '[' + r.p.id + '] ' + (r.spk ? '(' + (r.spk === '?' ? 'unknown' : r.spk) + ') ' : '') + r.text).join('\n');
    return {
      max_tokens: 3000,
      system: 'You review live transcripts of talks for speaker changes. Turns already marked show the speaker in brackets, like (A) or (B), at the start of a line; the speaker carries on until the next marked turn. (unknown) marks a turn where the listener knew the voice changed but not who it was.',
      messages: [{ role: 'user', content: contextBlock(ctx) + 'Known speakers: ' + ids.join(', ') + (Object.keys(rec.speakers || {}).filter((k) => rec.speakers[k]).length ? ' (' + ids.map((k) => k + (rec.speakers && rec.speakers[k] ? ' = ' + rec.speakers[k] : '')).join(', ') + ')' : '') +
        '.\n\nTranscript, one numbered line per phrase:\n' + lines +
        '\n\n1. For every (unknown) turn, say which known speaker it most likely is, or "new" for someone else.\n2. Find places where a different person clearly starts talking that are NOT marked, such as an audience question, a moderator handing over, or a reply. Give the first few words of the new turn exactly as written, and who it is (a known letter or "new"). Only report changes you are fairly sure of.' }],
      tools: [{
        name: 'report_speakers',
        description: 'Report who the unknown turns are and where unmarked speaker changes happen.',
        input_schema: {
          type: 'object',
          properties: {
            changes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  line: { type: 'integer', description: 'the [number] of the line' },
                  quote: { type: 'string', description: 'first words of the new turn, exactly as written; empty for an (unknown) turn' },
                  speaker: { type: 'string', description: 'a known speaker letter, or "new"' },
                  reason: { type: 'string', description: 'a few words of why' },
                },
                required: ['line', 'speaker'],
              },
            },
          },
          required: ['changes'],
        },
      }],
      tool_choice: { type: 'tool', name: 'report_speakers' },
    };
  }

  /** Adds Claude's speaker suggestions as speaker questions; returns how many. */
  function applySpeakers(rec, response) {
    const res = typeof response === 'string' ? JSON.parse(response) : response;
    const block = (res.content || []).find((c) => c.type === 'tool_use');
    const changes = (block && block.input && block.input.changes) || [];
    unknownTurnFlags(rec);
    let n = 0;
    for (const c of changes) {
      const sp = String(c.speaker || '').trim();
      const who = sp.toLowerCase() === 'new' ? 'new' : sp.toUpperCase();
      const p = phraseById(rec, c.line);
      if (!p || !who) continue;
      let ws = 0;
      if (c.quote && String(c.quote).trim()) {
        const r = findRange(p, c.quote);
        if (!r) continue;
        ws = r[0];
      }
      if (ws === 0 && p.spk === '?') {
        const f = rec.flags.find((x) => x.kind === 'spk' && x.unknown && x.p === p.id);
        if (f) { f.sugg = [who]; f.reason = c.reason || 'Claude\u2019s guess'; f.src = 'unk'; n++; }
        continue;
      }
      if (ws === 0 && p.spk) continue; // already marked
      if (rec.flags.some((x) => x.kind === 'spk' && x.p === p.id && x.ws === ws)) continue;
      rec.flags.push({ id: 'f' + Math.random().toString(36).slice(2, 8), kind: 'spk', unknown: false, p: p.id, ws, we: ws + 1, sugg: [who], reason: c.reason || '', src: 'spk-ai' });
      n++;
    }
    sortFlags(rec);
    return n;
  }

  // ---------------------------------------------------------------- Claude

  function contextBlock(ctx) {
    ctx = String(ctx || '').trim();
    return ctx ? 'Context from the listener (topic, names, terms to expect):\n' + ctx + '\n\n' : '';
  }

  function auditRequest(rec, opts, ctx) {
    const lines = render(rec, opts).map((r) => '[' + r.p.id + '] ' + r.text).join('\n');
    return {
      max_tokens: 4000,
      system: 'You proofread live speech-to-text transcripts of talks and presentations. Find words or short phrases that the speech recogniser probably MISHEARD: wrong homophones, words that make no sense in context, garbled names, products, places or technical terms. Do not flag grammar, style, filler words, missing punctuation or things that are merely informal. Only flag when a different reading is clearly more likely. Copy each quote exactly from the numbered line it is on, keeping it as short as possible.',
      messages: [{ role: 'user', content: contextBlock(ctx) + 'Transcript, one numbered line per phrase:\n' + lines }],
      tools: [{
        name: 'report_misheard',
        description: 'Report the words that were probably misheard, with the likely intended words.',
        input_schema: {
          type: 'object',
          properties: {
            flags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  line: { type: 'integer', description: 'the [number] of the line' },
                  quote: { type: 'string', description: 'exact words from that line' },
                  suggestion: { type: 'string', description: 'what was probably said' },
                  reason: { type: 'string', description: 'a few words of why' },
                },
                required: ['line', 'quote', 'suggestion'],
              },
            },
          },
          required: ['flags'],
        },
      }],
      tool_choice: { type: 'tool', name: 'report_misheard' },
    };
  }

  /** Adds Claude's flags to the recording; returns how many were new. */
  function applyAudit(rec, response) {
    const res = typeof response === 'string' ? JSON.parse(response) : response;
    const block = (res.content || []).find((c) => c.type === 'tool_use');
    const flags = (block && block.input && block.input.flags) || [];
    let n = 0;
    for (const f of flags) {
      const ids = [f.line, f.line - 1, f.line + 1];
      let hit = null;
      for (const id of ids) {
        const p = phraseById(rec, id);
        const r = p && findRange(p, f.quote);
        if (r) { hit = { p: id, ws: r[0], we: r[1] }; break; }
      }
      if (!hit) {
        for (const p of rec.phrases) { const r = findRange(p, f.quote); if (r) { hit = { p: p.id, ws: r[0], we: r[1] }; break; } }
      }
      if (hit && addFlag(rec, Object.assign(hit, { sugg: [f.suggestion], reason: f.reason || '', src: 'ai' }))) n++;
    }
    sortFlags(rec);
    return n;
  }

  function summaryRequest(rec, opts, ctx) {
    return {
      max_tokens: 1500,
      system: 'You write concise notes from talk transcripts. The transcript came from live speech recognition, so some words may be misheard: infer the intended meaning and never repeat obvious recognition errors.',
      messages: [{
        role: 'user',
        content: contextBlock(ctx) + 'Transcript:\n' + renderFixedAware(rec, opts) +
          '\n\nReply in plain text, no markdown. First line: "Title: " and a title of at most 8 words. Then the key points as 5 to 12 short lines, each starting with "- ". Include specific names, tools, numbers and recommendations the speaker mentioned. If there are clear action items or things to look up, end with a line "Follow up:" and more "- " lines.',
      }],
    };
  }

  function applySummary(rec, response) {
    const res = typeof response === 'string' ? JSON.parse(response) : response;
    let text = (res.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    const m = text.match(/^\s*title:\s*(.+)\s*$/im);
    if (m) {
      if (!rec.title) rec.title = m[1].replace(/^["']|["']$/g, '').trim();
      text = text.replace(m[0], '').trim();
    }
    rec.summary = text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[*•]\s+/gm, '- ');
    rec.updated = Date.now();
    return rec.summary;
  }

  // ---------------------------------------------------------------- groups
  // groups.json: { groups: [{ id, name, created, updated, ids: [recordingId], summary, title }] }
  // A recording is in at most one group.

  function newGroup(name, now) {
    now = now || Date.now();
    return { id: 'g' + now.toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, '0'),
      name: String(name || '').trim() || 'New group', created: now, updated: now, ids: [], summary: '', title: '' };
  }

  /** Moves recordings into a group (taking them out of any other). */
  function assignToGroup(data, groupId, ids) {
    for (const g of data.groups) {
      g.ids = g.ids.filter((id) => !ids.includes(id));
      if (g.id === groupId) { g.ids = g.ids.concat(ids); g.updated = Date.now(); }
    }
    return data;
  }

  function removeFromGroups(data, ids) {
    for (const g of data.groups) {
      const before = g.ids.length;
      g.ids = g.ids.filter((id) => !ids.includes(id));
      if (g.ids.length !== before) g.updated = Date.now();
    }
    return data;
  }

  const groupOf = (data, id) => data.groups.find((g) => g.ids.includes(id)) || null;

  /** Key points across several recordings (in time order), e.g. a conference day or one talk. */
  function groupSummaryRequest(name, recs, opts, ctx) {
    const parts = recs.slice().sort((a, b) => (a.created || 0) - (b.created || 0)).map((r, i) =>
      '--- Segment ' + (i + 1) + ': ' + titleOf(r) + ' ---\n' + renderFixedAware(r, opts));
    return {
      max_tokens: 3000,
      system: 'You write concise notes from transcripts of talks. The transcripts came from live speech recognition, so some words may be misheard: infer the intended meaning and never repeat obvious recognition errors.',
      messages: [{
        role: 'user',
        content: contextBlock(ctx) + 'These ' + recs.length + ' transcript segments belong together (the listener grouped them as \u201C' + name + '\u201D):\n\n' + parts.join('\n\n') +
          '\n\nReply in plain text, no markdown. First line: "Title: " and a title of at most 8 words. Then the key points across all segments as 6 to 15 short lines, each starting with "- ", grouped by theme rather than by segment. Include specific names, tools, numbers and recommendations mentioned. If there are clear action items or things to look up, end with a line "Follow up:" and more "- " lines.',
      }],
    };
  }

  const groupKeyPointsText = (g) => 'Key points \u2014 ' + (g.name || g.title) + '\n' + (g.summary || '').trim();

  const keyPointsText = (rec) => 'Key points — ' + titleOf(rec) + '\n' + (rec.summary || '').trim();

  const api = {
    words, norm, newRecording, defaultTitle, titleOf, render, plain: renderFixedAware, wordCount,
    phraseById, addPhrase, altFlags, findRange, localCheck, addFlag, sortFlags, replaceWords, applyFlag,
    keepFlag, deletePhrase, deleteLastWord, setEditedText, auditRequest, applyAudit, summaryRequest,
    applySummary, keyPointsText, speakerIds, usesLabels, speakerName, speakerTag, newSpeakerId, declareSpeaker,
    renameSpeaker, currentSpeaker, splitTurn, clearTurn, unknownTurnFlags, resolveSpeakerFlag, dismissSpeakerFlag,
    speakerRequest, applySpeakers, newGroup, assignToGroup, removeFromGroups, groupOf, groupSummaryRequest,
    groupKeyPointsText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KBCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
