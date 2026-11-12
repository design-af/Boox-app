// AFS Dictation floating panel (runs in DictationService's overlay WebView).
// Live: the recording being transcribed now. Move to prep sends it to Prep and the next words
// start a new Live recording (recording never stops for this). Prep: Check (possible
// mishearings), Key points (Claude), Edit (in the app), Push (into the focused field).
// Library: every recording. All recordings are saved through the native bridge (AFSPanel).
(function () {
  'use strict';
  const K = window.KBCore;
  const N = window.AFSPanel || mockNative();
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let settings = { cap: true, autoPeriod: true, hasKey: false, context: '', accessibility: false };
  let st = { liveId: null, prepId: null };
  let live = null, prep = null;
  let tab = 'live', prepView = 'text';
  let partial = '', running = false, panelOpen = true, partialTimer = 0, lastPartialDraw = 0;
  let pending = { end: null, br: false };
  let flagIdx = -1, selWord = null, busy = false;
  const undo = [];
  const calls = {};
  let callSeq = 0;

  const opts = () => ({ cap: settings.cap, autoPeriod: settings.autoPeriod });

  // ---------------------------------------------------------------- storage

  function load(id) {
    if (!id) return null;
    try { const s = N.load(id); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function save(rec) {
    if (!rec) return;
    if (rec === live) { clearTimeout(liveSaveTimer); liveDirty = false; }
    rec.updated = Date.now();
    N.save(rec.id, JSON.stringify(rec));
  }
  // While recording, Live is saved every few seconds instead of after every phrase, so the
  // tablet isn't rewriting a growing file constantly. (Every phrase is also in the raw backup.)
  let liveSaveTimer = 0, liveDirty = false;
  function saveLiveSoon() {
    liveDirty = true;
    clearTimeout(liveSaveTimer);
    liveSaveTimer = setTimeout(flushLive, 15000);
  }
  function flushLive() { if (liveDirty && live) save(live); }
  function saveState() { N.saveState(JSON.stringify(st)); }
  function snapshot(kind) {
    if (kind === 'state') undo.push({ kind, json: JSON.stringify(st) });
    else {
      const rec = kind === 'live' ? live : prep;
      if (!rec) return;
      undo.push({ kind, json: JSON.stringify(rec) });
    }
    if (undo.length > 40) undo.shift();
  }
  function doUndo() {
    const u = undo.pop();
    if (!u) { msg('Nothing to undo'); return; }
    if (u.kind === 'clear') {
      // Bring the cleared Live text back; anything heard since is kept after it.
      const rec = JSON.parse(u.json);
      if (live && live.id !== rec.id) {
        for (const p of live.phrases) { p.id = rec.nextPid++; rec.phrases.push(p); }
        N.remove(live.id);
      }
      live = rec;
      st.liveId = rec.id;
      save(live);
      saveState();
    } else if (u.kind === 'state') {
      st = JSON.parse(u.json);
      saveState();
      live = load(st.liveId);
      prep = load(st.prepId);
    } else {
      const rec = JSON.parse(u.json);
      save(rec);
      if (u.kind === 'live') live = rec; else prep = rec;
    }
    flagIdx = -1; selWord = null;
    msg('Undone');
    renderAll();
  }

  function reloadAll() {
    try { settings = Object.assign(settings, JSON.parse(N.settings())); } catch (e) { }
    try { st = Object.assign({ liveId: null, prepId: null }, JSON.parse(N.loadState() || '{}')); } catch (e) { }
    live = load(st.liveId);
    prep = load(st.prepId);
    if (!live) st.liveId = null;
    if (!prep) st.prepId = null;
    renderAll();
  }

  // ---------------------------------------------------------------- messages

  let msgTimer = 0;
  function msg(t, keep) {
    $('msg').textContent = t || '';
    clearTimeout(msgTimer);
    if (t && !keep) msgTimer = setTimeout(() => { $('msg').textContent = ''; }, 9000);
  }
  function setBusy(b, text) {
    busy = b;
    ['check', 'points', 'push'].forEach((id) => { $(id).disabled = b; });
    if (text) msg(text, b);
  }

  // ---------------------------------------------------------------- rendering

  function textHtml(rec, interactive, withPartial, tail) {
    const out = [];
    const flagged = new Map();
    if (interactive) {
      rec.flags.forEach((f, idx) => {
        for (let i = f.ws; i < f.we; i++) flagged.set(f.p + ':' + i, idx);
      });
    }
    let rows = K.render(rec, opts());
    if (tail && rows.length > tail) {
      out.push('<span class="sm">\u2026 earlier text is saved; it all goes to Prep.</span><br>');
      rows = rows.slice(-tail);
      rows[0] = Object.assign({}, rows[0], { sep: '' });
    }
    for (const r of rows) {
      if (r.sep === '\n') out.push('<br>');
      else if (r.sep) out.push(' ');
      if (r.p.fixed) {
        out.push(esc(String(r.p.raw).trim()).replace(/\n/g, '<br>'));
        continue;
      }
      r.words.forEach((w, i) => {
        let cls = 'w';
        const fi = flagged.get(r.p.id + ':' + i);
        if (fi !== undefined) cls += fi === flagIdx ? ' f cur' : ' f';
        if (selWord && selWord.p === r.p.id && selWord.i === i) cls += ' sel';
        out.push((i ? ' ' : '') + '<span class="' + cls + '" data-p="' + r.p.id + '" data-i="' + i + '">' + esc(w) + '</span>');
      });
    }
    if (withPartial) out.push(' <span class="partial" id="partial">' + esc(partial) + '</span>');
    return out.join('');
  }

  function meta(rec) {
    const n = K.wordCount(rec);
    const bits = [n + ' words'];
    if (rec.pushed) bits.push('pushed');
    if (rec.summary) bits.push('key points');
    return bits.join(' · ');
  }

  function nearBottom(el) { return el.scrollHeight - el.scrollTop - el.clientHeight < 60; }

  function renderContent() {
    if (!panelOpen) return; // folded: nothing to draw (saves e-ink refreshes)
    const c = $('content');
    const stick = nearBottom(c);
    if (tab === 'live') {
      if (!live || !live.phrases.length) {
        c.innerHTML = (partial ? '<span class="partial" id="partial">' + esc(partial) + '</span>' : '') +
          '<p class="empty">' + (running ? 'Listening… words appear here.' : 'Tap ● Start (or long-press the bubble). Words collect here.') + '</p>';
      } else {
        c.innerHTML = '<div class="head"><b>' + esc(K.titleOf(live)) + '</b><span>' + meta(live) + '</span></div>' + textHtml(live, false, true, 40);
      }
      if (stick || running) c.scrollTop = c.scrollHeight;
    } else if (tab === 'prep') {
      if (!prep) {
        c.innerHTML = '<p class="empty">Nothing in Prep. In Live tap <b>Prep ▸</b>, or open one from the Library.</p>';
      } else if (prepView === 'points') {
        c.innerHTML = '<div class="head"><b>' + esc(K.titleOf(prep)) + '</b><span>Key points</span></div>' +
          (prep.summary ? '<div class="points">' + esc(prep.summary) + '</div>' : '<p class="empty">No key points yet. Tap <b>Summarise</b>.</p>');
      } else {
        const flags = prep.flags.length ? ' · ' + prep.flags.length + ' to review' : '';
        c.innerHTML = '<div class="head"><b>' + esc(K.titleOf(prep)) + '</b><span>' + meta(prep) + flags + '</span></div>' + textHtml(prep, true, false);
        const cur = c.querySelector('.cur');
        if (cur) cur.scrollIntoView({ block: 'center' });
      }
    } else {
      renderLibrary();
    }
  }

  function renderLibrary() {
    let items = [];
    try { items = JSON.parse(N.list() || '[]'); } catch (e) { }
    items.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    if (!items.length) { $('content').innerHTML = '<p class="empty">No recordings yet.</p>'; return; }
    $('content').innerHTML = '<ul class="lib">' + items.map((m) => {
      const where = m.id === st.liveId ? 'LIVE · ' : m.id === st.prepId ? 'IN PREP · ' : '';
      const d = new Date(m.created || m.updated);
      const when = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const bits = [when, m.words + ' words'];
      if (m.hasSummary) bits.push('key points');
      if (m.pushed) bits.push('pushed ✓');
      return '<li data-id="' + esc(m.id) + '"><span class="t">' + esc(m.title || K.defaultTitle({ created: m.created })) + '</span><span class="m">' + where + bits.join(' · ') + '</span></li>';
    }).join('') + '</ul>';
  }

  // Partial words are redrawn at most about once a second: every redraw is an e-ink refresh.
  function schedulePartial() {
    if (!panelOpen || tab !== 'live') return;
    const wait = Math.max(0, 900 - (Date.now() - lastPartialDraw));
    if (partialTimer) return;
    partialTimer = setTimeout(() => { partialTimer = 0; lastPartialDraw = Date.now(); renderPartial(); }, wait);
  }

  function renderPartial() {
    if (!panelOpen || tab !== 'live') return;
    const p = $('partial');
    if (!p) { renderContent(); return; }
    const c = $('content');
    const stick = nearBottom(c);
    p.textContent = partial;
    if (stick) c.scrollTop = c.scrollHeight;
  }

  function renderPop() {
    const pop = $('pop');
    if (tab !== 'prep' || !prep || prepView !== 'text') { pop.className = ''; pop.innerHTML = ''; return; }
    const f = flagIdx >= 0 ? prep.flags[flagIdx] : null;
    if (f) {
      const p = K.phraseById(prep, f.p);
      const heard = p ? K.words(p.raw).slice(f.ws, f.we).join(' ') : '';
      pop.innerHTML =
        '<div class="h">Heard “<b>' + esc(heard) + '</b>” <span class="sm">' + esc(f.reason || '') + (f.src === 'ai' ? ' · Claude' : ' · speech engine') + '</span></div>' +
        '<div class="r">' + f.sugg.map((s, i) => '<button data-sugg="' + i + '">' + esc(s) + '</button>').join('') +
        '<button data-act="keep">Keep</button><button data-act="del">Delete</button></div>' +
        '<div class="r"><button data-act="prev">&lsaquo;</button><button data-act="next">' + (flagIdx + 1) + '/' + prep.flags.length + ' &rsaquo;</button><button data-act="done">Done</button></div>';
      pop.className = 'show';
    } else if (selWord) {
      const p = K.phraseById(prep, selWord.p);
      const w = p ? K.words(p.raw)[selWord.i] : '';
      pop.innerHTML = '<div class="h">“<b>' + esc(w || '') + '</b>”</div><div class="r">' +
        '<button data-act="delword">Delete word</button><button data-act="delphrase">Delete phrase</button>' +
        '<button data-act="breakhere">New paragraph here</button><button data-act="close">Close</button></div>';
      pop.className = 'show';
    } else { pop.className = ''; pop.innerHTML = ''; }
  }

  function renderChrome() {
    $('t-live').className = tab === 'live' ? 'on' : '';
    $('t-prep').className = tab === 'prep' ? 'on' : '';
    $('t-lib').className = tab === 'library' ? 'on' : '';
    $('t-live').textContent = 'Live' + (live && live.phrases.length ? ' (' + K.wordCount(live) + ')' : '');
    $('t-prep').textContent = 'Prep' + (prep ? (prep.flags.length ? ' (' + prep.flags.length + ' ?)' : ' ✓') : '');
    $('act-live').hidden = tab !== 'live';
    $('act-prep').hidden = tab !== 'prep';
    $('act-lib').hidden = tab !== 'library';
    $('view').textContent = prepView === 'points' ? 'Text' : 'Points';
    $('push').innerHTML = prepView === 'points' ? 'Push pts &#9656;' : 'Push &#9656;';
    $('start').innerHTML = running ? '&#9632; Stop' : '&#9679; Start';
    $('start').className = running ? 'dark' : '';
  }

  function renderAll() {
    renderChrome();
    renderPop();
    // While reviewing a word, its controls replace the Prep buttons to leave room for the text.
    if ($('pop').className === 'show') $('act-prep').hidden = true;
    renderContent();
  }

  // ---------------------------------------------------------------- native events

  window.KB = {
    onState(isRunning, text) {
      running = !!isRunning;
      if (!running) flushLive();
      $('status').textContent = running ? '● ' + (text || 'Listening') : 'Stopped';
      if (!running && text && text !== 'Stopped') msg(text);
      renderChrome();
    },
    onPartial(t) { partial = t || ''; schedulePartial(); },
    onPhrase(json) {
      let h;
      try { h = JSON.parse(json); } catch (e) { return; }
      if (!live) {
        live = K.newRecording();
        st.liveId = live.id;
        saveState();
      }
      K.addPhrase(live, h, pending);
      pending = { end: null, br: false };
      partial = '';
      if (live.phrases.length === 1) save(live); else saveLiveSoon();
      if (!panelOpen) return;
      renderChrome();
      if (tab === 'live') renderContent();
    },
    onCut() {
      if (!cutting) return;
      clearTimeout(cutTimer);
      cutting = false;
      $('move').disabled = false;
      moveToPrep();
    },
    onPanel(open) {
      panelOpen = !!open;
      if (open) { flushLive(); reloadAll(); }
      else flushLive();
    },
    onPushed(result, diag) {
      setBusy(false);
      if (result === 'pasted' || result === 'set') {
        prep.pushed = Date.now();
        save(prep);
        msg('Pushed into the field ✓');
        renderAll();
      } else if (result.indexOf('noservice') === 0) {
        msg('Copied — long-press the field and Paste. (Turn on AFS Dictation in Accessibility to push directly.)', true);
      } else {
        msg('Couldn’t find the text field — copied instead, so long-press it and Paste.' + (diag ? ' Details: ' + diag : ''), true);
      }
    },
    onClaude(id, ok, text) {
      const c = calls[id];
      delete calls[id];
      if (c) (ok ? c.resolve : c.reject)(ok ? text : new Error(text));
    },
  };

  function claude(body) {
    return new Promise((resolve, reject) => {
      const id = 'c' + (++callSeq);
      calls[id] = { resolve, reject };
      N.claude(id, JSON.stringify(body));
    });
  }

  // ---------------------------------------------------------------- actions

  function setTab(t) {
    tab = t;
    selWord = null;
    if (t !== 'prep') flagIdx = -1;
    renderAll();
  }

  // Prep ▸ while recording: the recogniser first finishes the sentence being spoken (native
  // cut), that phrase lands in Live, then Live becomes a Prep segment and recording carries on
  // into a new Live segment. The segment is then processed (Check + Key points) automatically.
  let cutting = false, cutTimer = 0;
  function prepClick() {
    if (cutting) return;
    if (!running) { moveToPrep(); return; }
    cutting = true;
    $('move').disabled = true;
    msg('Finishing the sentence\u2026', true);
    N.cut();
    cutTimer = setTimeout(() => KB.onCut(), 6000);
  }

  function clearLive() {
    if (!live || !live.phrases.length) { msg('Live is already empty'); return; }
    undo.push({ kind: 'clear', json: JSON.stringify(live) });
    N.remove(live.id);
    live = null;
    st.liveId = null;
    saveState();
    msg('Live cleared \u2014 Undo brings it back');
    renderAll();
  }

  function moveToPrep() {
    if (!live || !live.phrases.length) { msg('Nothing in Live yet'); return; }
    save(live);
    snapshot('state');
    prep = live;
    st.prepId = live.id;
    live = null;
    st.liveId = null;
    saveState();
    flagIdx = -1; selWord = null; prepView = 'text';
    tab = 'prep';
    renderAll();
    processSegment(prep);
  }

  /** Check + Key points for a segment that just arrived in Prep. */
  async function processSegment(rec) {
    const local = K.localCheck(rec);
    save(rec);
    const cont = running ? ' Still recording into the next segment.' : '';
    if (!settings.hasKey) {
      if (prep === rec && tab === 'prep') flagIdx = rec.flags.length ? 0 : -1;
      msg((rec.flags.length ? rec.flags.length + ' unsure words to review.' : 'Moved to Prep.') + cont, true);
      renderAll();
      return;
    }
    setBusy(true, 'Processing: checking words and writing key points\u2026' + cont);
    const wantPoints = K.wordCount(rec) >= 15;
    const [audit, points] = await Promise.allSettled([
      claude(K.auditRequest(rec, opts(), settings.context)),
      wantPoints ? claude(K.summaryRequest(rec, opts(), settings.context)) : Promise.resolve(null),
    ]);
    const problems = [];
    if (audit.status === 'fulfilled') { try { K.applyAudit(rec, audit.value); } catch (e) { problems.push('check: ' + e.message); } }
    else problems.push('check: ' + audit.reason.message);
    if (points.status === 'fulfilled' && points.value) { try { K.applySummary(rec, points.value); } catch (e) { problems.push('key points: ' + e.message); } }
    else if (points.status === 'rejected') problems.push('key points: ' + points.reason.message);
    save(rec);
    setBusy(false);
    if (prep === rec && tab === 'prep' && prepView === 'text') flagIdx = rec.flags.length ? 0 : -1;
    const done = [];
    done.push(rec.flags.length ? rec.flags.length + ' to review' : 'nothing looks misheard');
    if (rec.summary) done.push('key points ready');
    msg('Ready: ' + done.join(', ') + '.' + (problems.length ? ' (' + problems.join('; ') + ')' : '') + cont, true);
    renderAll();
  }


  async function check() {
    if (!prep || busy) return;
    snapshot('prep');
    const local = K.localCheck(prep);
    if (!settings.hasKey) {
      save(prep);
      flagIdx = prep.flags.length ? 0 : -1;
      msg(local + ' unsure words from the speech engine. Add a Claude API key in the app (Dictation) for a full check.', true);
      renderAll();
      return;
    }
    setBusy(true, 'Checking with Claude…');
    try {
      const res = await claude(K.auditRequest(prep, opts(), settings.context));
      const ai = K.applyAudit(prep, res);
      save(prep);
      flagIdx = prep.flags.length ? 0 : -1;
      setBusy(false);
      msg(prep.flags.length ? prep.flags.length + ' to review (' + ai + ' from Claude, ' + local + ' from the speech engine)' : 'Nothing looks misheard ✓');
    } catch (e) {
      setBusy(false);
      save(prep);
      flagIdx = prep.flags.length ? 0 : -1;
      msg('Claude check failed: ' + e.message + (local ? ' — showing ' + local + ' from the speech engine' : ''), true);
    }
    prepView = 'text';
    renderAll();
  }

  async function keyPoints() {
    if (!prep || busy) return;
    if (!settings.hasKey) { msg('Key points need a Claude API key — add it in the app: Dictation → Settings', true); return; }
    if (K.wordCount(prep) < 15) { msg('Too short to summarise'); return; }
    snapshot('prep');
    setBusy(true, 'Writing key points…');
    try {
      const res = await claude(K.summaryRequest(prep, opts(), settings.context));
      K.applySummary(prep, res);
      save(prep);
      prepView = 'points';
      flagIdx = -1;
      setBusy(false);
      msg('Key points ready — Push inserts them');
    } catch (e) {
      setBusy(false);
      msg('Key points failed: ' + e.message, true);
    }
    renderAll();
  }

  function push() {
    if (!prep || busy) { if (!prep) msg('Nothing in Prep'); return; }
    const text = prepView === 'points' ? (prep.summary ? K.keyPointsText(prep) : '') : K.plain(prep, opts());
    if (!text.trim()) { msg(prepView === 'points' ? 'No key points yet' : 'Nothing to push'); return; }
    setBusy(true, 'Pushing…');
    N.push(text);
  }

  function openFromLibrary(id) {
    if (id === st.liveId) { setTab('live'); return; }
    const rec = load(id);
    if (!rec) { msg('Could not open that recording'); return; }
    snapshot('state');
    prep = rec;
    st.prepId = id;
    saveState();
    prepView = 'text'; flagIdx = -1; selWord = null;
    setTab('prep');
  }

  function popAction(act, suggIdx) {
    if (!prep) return;
    const f = flagIdx >= 0 ? prep.flags[flagIdx] : null;
    if (suggIdx != null && f) {
      snapshot('prep'); K.applyFlag(prep, f, f.sugg[suggIdx]); save(prep);
    } else if (act === 'keep' && f) {
      snapshot('prep'); K.keepFlag(prep, f); save(prep);
    } else if (act === 'del' && f) {
      snapshot('prep'); K.applyFlag(prep, f, ''); save(prep);
    } else if (act === 'prev') {
      flagIdx = Math.max(0, flagIdx - 1); renderAll(); return;
    } else if (act === 'next') {
      flagIdx = Math.min(prep.flags.length - 1, flagIdx + 1); renderAll(); return;
    } else if (act === 'done') {
      flagIdx = -1; renderAll(); return;
    } else if (act === 'delword' && selWord) {
      snapshot('prep'); K.replaceWords(prep, selWord.p, selWord.i, selWord.i + 1, ''); save(prep); selWord = null;
    } else if (act === 'delphrase' && selWord) {
      snapshot('prep'); K.deletePhrase(prep, selWord.p); save(prep); selWord = null;
    } else if (act === 'breakhere' && selWord) {
      snapshot('prep'); splitAt(prep, selWord.p, selWord.i); save(prep); selWord = null;
    } else if (act === 'close') {
      selWord = null; renderAll(); return;
    }
    // After a fix the next flag slides into the same index.
    if (f) {
      if (!prep.flags.length) { flagIdx = -1; msg('All reviewed ✓'); }
      else flagIdx = Math.min(flagIdx, prep.flags.length - 1);
    }
    renderAll();
  }

  /** Starts a new paragraph at word i of phrase pid (splitting the phrase if needed). */
  function splitAt(rec, pid, i) {
    const idx = rec.phrases.findIndex((p) => p.id === pid);
    if (idx < 0) return;
    const p = rec.phrases[idx];
    if (i === 0) { p.br = true; return; }
    const W = K.words(p.raw);
    const tail = { id: rec.nextPid++, raw: W.slice(i).join(' '), alts: [], conf: -1, end: p.end, br: true };
    p.raw = W.slice(0, i).join(' ');
    p.end = null;
    p.alts = [];
    rec.flags = rec.flags.filter((f) => f.p !== pid);
    rec.phrases.splice(idx + 1, 0, tail);
  }

  // ---------------------------------------------------------------- wiring

  $('t-live').onclick = () => setTab('live');
  $('t-prep').onclick = () => setTab('prep');
  $('t-lib').onclick = () => setTab('library');
  $('start').onclick = () => (running ? N.stop() : N.start());
  $('min').onclick = () => N.collapse();
  $('move').onclick = prepClick;
  $('clear').onclick = clearLive;
  $('check').onclick = check;
  $('points').onclick = keyPoints;
  $('view').onclick = () => { prepView = prepView === 'points' ? 'text' : 'points'; flagIdx = -1; selWord = null; renderAll(); };
  $('edit').onclick = () => { if (prep) N.openApp('tools/dictation/index.html#rec=' + prep.id); };
  $('push').onclick = push;
  document.querySelectorAll('.undo').forEach((b) => { b.onclick = doUndo; });
  $('lib-refresh').onclick = () => renderContent();
  $('lib-app').onclick = () => N.openApp('tools/dictation/index.html#library');
  let quitArmed = 0;
  $('quit').onclick = () => {
    if (running) { msg('Stop recording first'); return; }
    if (Date.now() - quitArmed < 4000) { flushLive(); N.quit(); return; }
    quitArmed = Date.now();
    msg('Tap Close button again to remove the floating button');
  };
  $('content').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (li) { openFromLibrary(li.dataset.id); return; }
    const w = e.target.closest('.w');
    if (!w || tab !== 'prep' || prepView !== 'text' || !prep) return;
    const p = Number(w.dataset.p), i = Number(w.dataset.i);
    const fi = prep.flags.findIndex((f) => f.p === p && i >= f.ws && i < f.we);
    if (fi >= 0) { flagIdx = fi; selWord = null; }
    else { flagIdx = -1; selWord = { p, i }; }
    renderAll();
  });
  $('pop').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    popAction(b.dataset.act, b.dataset.sugg != null ? Number(b.dataset.sugg) : null);
  });

  // ---------------------------------------------------------------- start

  function mockNative() {
    // Desktop preview only: fake bridge backed by localStorage.
    const ls = window.localStorage;
    const self = {
      _timer: 0,
      ready() { }, collapse() { }, quit() { }, openApp(p) { console.log('openApp', p); },
      start() {
        KB.onState(true, 'Listening');
        const lines = ['welcome to the session on computational design', 'today we look at rabbit families and grasshopper scripts', 'any questions'];
        let k = 0;
        self._timer = setInterval(() => {
          const t = lines[k++ % lines.length];
          KB.onPartial(t.split(' ').slice(0, 3).join(' '));
          setTimeout(() => KB.onPhrase(JSON.stringify({ text: t, alts: [t.replace('rabbit', 'revit')], conf: 0.8 })), 300);
        }, 1200);
      },
      stop() { clearInterval(self._timer); KB.onState(false, 'Stopped'); },
      push(t) { console.log('PUSH', t); setTimeout(() => KB.onPushed('pasted'), 50); },
      cut() { setTimeout(() => { KB.onPhrase(JSON.stringify({ text: 'and that is the end of the sentence' })); KB.onCut(); }, 300); },
      remove(id) { ls.removeItem('rec:' + id); },
      list() {
        const out = [];
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k.startsWith('rec:')) { const r = JSON.parse(ls.getItem(k)); out.push({ id: r.id, title: r.title, created: r.created, updated: r.updated, words: K.wordCount(r), pushed: r.pushed, hasSummary: !!r.summary }); }
        }
        return JSON.stringify(out);
      },
      load(id) { return ls.getItem('rec:' + id) || ''; },
      save(id, j) { ls.setItem('rec:' + id, j); return true; },
      loadState() { return ls.getItem('state') || '{}'; },
      saveState(j) { ls.setItem('state', j); return true; },
      settings() { return JSON.stringify({ hasKey: false }); },
      claude(id) { setTimeout(() => KB.onClaude(id, false, 'no key in preview'), 100); },
    };
    return self;
  }

  reloadAll();
  N.ready();
})();
