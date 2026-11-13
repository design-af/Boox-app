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
    for (const p of (rec && rec.phrases) || []) {
      const ws = words(p.raw);
      if (!ws.length) continue;
      if (!p.fixed) {
        if (cap && (prevSent || p.br)) ws[0] = capFirst(ws[0]);
        let last = ws[ws.length - 1];
        if (p.end != null) last = last.replace(/[.?!,;:…]+$/, '') + p.end;
        else if (autoPeriod && !END_PUNCT.test(last)) last += '.';
        ws[ws.length - 1] = last;
      }
      const text = ws.join(' ');
      out.push({ p, words: ws, sep: out.length === 0 ? '' : (p.br ? '\n' : ' '), text });
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
    const existing = rec.flags.find((g) => overlaps(g, f));
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
    rec.flags = rec.flags.filter((f) => f.src === 'ai');
    let n = 0;
    for (const p of rec.phrases) for (const f of altFlags(p)) if (addFlag(rec, f)) n++;
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
    return render(rec, opts).map((r) => r.sep + (r.p.fixed ? String(r.p.raw).trim() : r.text)).join('');
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

  const keyPointsText = (rec) => 'Key points — ' + titleOf(rec) + '\n' + (rec.summary || '').trim();

  const api = {
    words, norm, newRecording, defaultTitle, titleOf, render, plain: renderFixedAware, wordCount,
    phraseById, addPhrase, altFlags, findRange, localCheck, addFlag, sortFlags, replaceWords, applyFlag,
    keepFlag, deletePhrase, deleteLastWord, setEditedText, auditRequest, applyAudit, summaryRequest,
    applySummary, keyPointsText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KBCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
