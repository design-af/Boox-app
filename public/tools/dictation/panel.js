// Aside Transcribe floating panel (runs in DictationService's overlay WebView).
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
  let flagIdx = -1, selWord = null, busy = false, confirmClear = false;
  let splitSel = null;        // { p, i }: "new speaker from this word" (Live or Prep)
  let sessPick = false;       // session picker open
  let groupsData = { groups: [] };
  let renameSpk = null;       // speaker id being renamed in Prep
  let badgeShown = null;      // last badge sent to the floating button
  const declaredEarly = [];   // speakers added before the Live recording exists
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
    flagIdx = -1; selWord = null; splitSel = null; renameSpk = null;
    updateBadge();
    msg('Undone');
    renderAll();
  }

  function reloadAll() {
    try { settings = Object.assign(settings, JSON.parse(N.settings())); } catch (e) { }
    try { st = Object.assign({ liveId: null, prepId: null }, JSON.parse(N.loadState() || '{}')); } catch (e) { }
    live = load(st.liveId);
    prep = load(st.prepId);
    loadGroups();
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
    ['check', 'speakers', 'points', 'push'].forEach((id) => { $(id).disabled = b; });
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
    const labels = K.usesLabels(rec);
    const spkAt = new Map();
    if (interactive) rec.flags.forEach((f) => { if (f.kind === 'spk' && !f.unknown) spkAt.set(f.p + ':' + f.ws, f); });
    let rows = K.render(rec, opts());
    if (tail && rows.length > tail) {
      out.push('<span class="sm">\u2026 earlier text is saved; it all goes to Prep.</span><br>');
      rows = rows.slice(-tail);
      rows[0] = Object.assign({}, rows[0], { sep: '' });
    }
    for (const r of rows) {
      if (r.sep === '\n') out.push('<br>');
      else if (r.sep) out.push(' ');
      if (r.spk && labels) {
        out.push('<span class="tag' + (r.spk === '?' ? ' unk' : '') + (renameSpk === r.spk ? ' cur' : '') + '" data-tag="' + esc(r.spk) + '" data-p="' + r.p.id + '">' + esc(K.speakerTag(rec, r.spk)) + '</span>');
      }
      if (r.p.fixed) {
        out.push(esc(String(r.p.raw).trim()).replace(/\n/g, '<br>'));
        continue;
      }
      r.words.forEach((w, i) => {
        let cls = 'w';
        const fi = flagged.get(r.p.id + ':' + i);
        if (fi !== undefined) cls += fi === flagIdx ? ' f cur' : ' f';
        if ((selWord && selWord.p === r.p.id && selWord.i === i) || (splitSel && splitSel.p === r.p.id && splitSel.i === i)) cls += ' sel';
        const q = spkAt.get(r.p.id + ':' + i);
        out.push((i ? ' ' : '') + (q ? '<span class="spkq">\u00B6?</span>' : '') + '<span class="' + cls + '" data-p="' + r.p.id + '" data-i="' + i + '">' + esc(w) + '</span>');
      });
    }
    if (withPartial) {
      const pt = pending.spk ? '<span class="tag' + (pending.spk === '?' ? ' unk' : '') + '">' + esc(K.speakerTag(rec, pending.spk)) + '</span>' : '';
      out.push((pending.spk ? '<br>' + pt : ' ') + '<span class="partial" id="partial">' + esc(partial) + '</span>');
    }
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
    }
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

  function speakerButtons(rec, attr, suggested) {
    return K.speakerIds(rec).map((id) => '<button ' + attr + '="' + esc(id) + '"' + (suggested === id ? ' class="dark"' : '') + '>' + esc(K.speakerTag(rec, id)) + '</button>').join('') +
      '<button ' + attr + '="new"' + (suggested === 'new' ? ' class="dark"' : '') + '>+ New</button>';
  }

  function renderPop() {
    const pop = $('pop');
    const hide = () => { pop.className = ''; pop.innerHTML = ''; };
    const rec = tab === 'live' ? live : prep;
    if (sessPick && tab === 'live') {
      let lastEv = null;
      const items = sessionList().map((g) => {
        let head = '';
        if (g.eventId && g.event !== lastEv) { lastEv = g.event; head = '<div class="ev">' + esc(g.event) + '</div>'; }
        else if (!g.eventId && lastEv !== '__plain') { lastEv = '__plain'; head = '<div class="ev">Groups</div>'; }
        return head + '<button data-sess="' + esc(g.id) + '"' + (g.id === st.sessionId ? ' class="dark"' : '') + '>' + esc(g.name) + '</button>';
      }).join('');
      pop.innerHTML = '<div class="h"><b>Which session is this?</b> <span class="sm">Segments you send to Prep go into it.</span></div>' +
        '<div class="sesslist">' + items + '</div>' +
        '<div class="r"><button data-sess="">None</button><button data-act="sesscancel">Cancel</button></div>';
      pop.className = 'show';
      return;
    }
    if (splitSel && rec) {
      const p = K.phraseById(rec, splitSel.p);
      const w = p ? K.words(p.raw)[splitSel.i] : '';
      pop.innerHTML = '<div class="h">New speaker from \u201C<b>' + esc(w || '') + '</b>\u201D:</div><div class="r">' + speakerButtons(rec, 'data-split', null) + '</div>' +
        '<div class="r"><button data-act="splitcancel">Cancel</button></div>';
      pop.className = 'show';
      return;
    }
    if (tab !== 'prep' || !prep || prepView !== 'text') { hide(); return; }
    if (renameSpk) {
      const cur = (prep.speakers && prep.speakers[renameSpk]) || '';
      pop.innerHTML = '<div class="h"><label for="rn"><b>Rename ' + esc(renameSpk) + '</b></label> <span class="sm">Changes every ' + esc(renameSpk) + ' in this recording.</span></div>' +
        '<input id="rn" type="text" autocomplete="off" value="' + esc(cur) + '" placeholder="Name or role">' +
        '<div class="r">' + ['Moderator', 'Speaker', 'Audience', 'Panelist'].map((n) => '<button data-name="' + n + '">' + n + '</button>').join('') + '</div>' +
        '<div class="r"><button data-act="rncancel">Cancel</button><button data-act="rnsave" class="dark">Save</button></div>';
      pop.className = 'show';
      return;
    }
    const f = flagIdx >= 0 ? prep.flags[flagIdx] : null;
    const nav = () => '<div class="r"><button data-act="prev">&lsaquo;</button><button data-act="next">' + (flagIdx + 1) + '/' + prep.flags.length + ' &rsaquo;</button><button data-act="done">Done</button></div>';
    if (f && f.kind === 'spk') {
      const p = K.phraseById(prep, f.p);
      const w = p ? K.words(p.raw).slice(f.ws, f.ws + 4).join(' ') : '';
      const head = f.unknown ? '<b>Who is this?</b> <span class="sm">' + esc(f.sugg && f.sugg.length ? 'Claude thinks ' + K.speakerTag(prep, f.sugg[0] === 'new' ? '?' : f.sugg[0]) + (f.sugg[0] === 'new' ? 'a new speaker' : '') + '.' : f.reason || '') + '</span>'
        : '<b>New speaker from \u201C' + esc(w) + '\u2026\u201D?</b> <span class="sm">' + esc(f.reason || '') + ' \u00B7 Claude</span>';
      pop.innerHTML = '<div class="h">' + head + '</div><div class="r">' + speakerButtons(prep, 'data-who', f.sugg && f.sugg[0]) +
        '<button data-act="notchange">Not a change</button></div>' + nav();
      pop.className = 'show';
      return;
    }
    if (f) {
      const p = K.phraseById(prep, f.p);
      const heard = p ? K.words(p.raw).slice(f.ws, f.we).join(' ') : '';
      pop.innerHTML =
        '<div class="h">Heard “<b>' + esc(heard) + '</b>” <span class="sm">' + esc(f.reason || '') + (f.src === 'ai' ? ' · Claude' : ' · speech engine') + '</span></div>' +
        '<div class="r">' + f.sugg.map((s, i) => '<button data-sugg="' + i + '">' + esc(s) + '</button>').join('') +
        '<button data-act="keep">Keep</button><button data-act="del">Delete</button></div>' +
        nav();
      pop.className = 'show';
    } else if (selWord) {
      const p = K.phraseById(prep, selWord.p);
      const w = p ? K.words(p.raw)[selWord.i] : '';
      pop.innerHTML = '<div class="h">“<b>' + esc(w || '') + '</b>”</div><div class="r">' +
        '<button data-act="delword">Delete word</button><button data-act="delphrase">Delete phrase</button>' +
        '<button data-act="spkhere">New speaker here</button><button data-act="close">Close</button></div>';
      pop.className = 'show';
    } else { pop.className = ''; pop.innerHTML = ''; }
  }

  function renderChrome() {
    $('t-live').className = tab === 'live' ? 'on' : '';
    $('t-prep').className = tab === 'prep' ? 'on' : '';
    $('t-live').textContent = 'Live' + (live && live.phrases.length ? ' (' + K.wordCount(live) + ')' : '');
    $('t-prep').textContent = 'Prep' + (prep ? (prep.flags.length ? ' (' + prep.flags.length + ' ?)' : ' ✓') : '');
    $('confirm-clear').hidden = !confirmClear || tab !== 'live';
    $('act-live').hidden = tab !== 'live' || confirmClear || !!splitSel;
    $('sess-row').hidden = tab !== 'live' || !groupsData.groups.length;
    const sg = sessionGroup();
    $('sess').textContent = 'Session: ' + (sg ? sg.name : 'none') + ' ▾';
    renderSpeakerRow();
    $('act-prep').hidden = tab !== 'prep';
    $('view').textContent = prepView === 'points' ? 'Text' : 'Points';
    $('push').innerHTML = prepView === 'points' ? 'Push pts &#9656;' : 'Push &#9656;';
    $('start').innerHTML = running ? '&#9632; Stop' : '&#9679; Start';
    $('start').className = running ? 'dark' : '';
  }

  /** The picked session's speakers, as names for A, B, C… */
  function sessionSpeakerNames() {
    const sg = sessionGroup();
    return sg && sg.speakers ? sg.speakers.map(K.shortName).filter(Boolean) : [];
  }

  function liveSpeakers() {
    const ids = live ? K.speakerIds(live) : ['A'];
    declaredEarly.forEach((id) => { if (!ids.includes(id)) ids.push(id); });
    // Before anything is heard, the session's speakers already show as chips.
    sessionSpeakerNames().forEach((n, i) => { const id = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]; if (id && !ids.includes(id)) ids.push(id); });
    return ids;
  }
  const liveCurrent = () => pending.spk || (live ? K.currentSpeaker(live) : 'A');
  function tagOf(id) {
    if (id === '?') return '?';
    if (live && live.speakers && live.speakers[id]) return live.speakers[id];
    const i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(id);
    const n = sessionSpeakerNames()[i];
    return n || (live ? K.speakerTag(live, id) : id);
  }

  function loadGroups() {
    try { groupsData = JSON.parse((N.groups && N.groups()) || '{"groups":[]}'); } catch (e) { groupsData = { groups: [] }; }
    if (!Array.isArray(groupsData.groups)) groupsData.groups = [];
    if (st.sessionId && !groupsData.groups.some((g) => g.id === st.sessionId)) st.sessionId = null;
  }
  const sessionGroup = () => groupsData.groups.find((g) => g.id === st.sessionId) || null;

  /** Sessions in programme order (events first), then other groups by name. */
  function sessionList() {
    const ev = groupsData.groups.filter((g) => g.eventId).sort((a, b) => (b.created || 0) - (a.created || 0) || (a.order || 0) - (b.order || 0));
    const byEvent = new Map();
    ev.forEach((g) => { if (!byEvent.has(g.eventId)) byEvent.set(g.eventId, []); byEvent.get(g.eventId).push(g); });
    const out = [];
    byEvent.forEach((list) => list.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((g) => out.push(g)));
    groupsData.groups.filter((g) => !g.eventId).sort((a, b) => a.name.localeCompare(b.name)).forEach((g) => out.push(g));
    return out;
  }

  function renderSpeakerRow() {
    const row = $('spk-row');
    row.hidden = tab !== 'live' || confirmClear || !!splitSel;
    if (row.hidden) return;
    const cur = liveCurrent();
    row.innerHTML = '<span class="lbl">Speaking</span>' + liveSpeakers().map((id) =>
      '<button data-chip="' + esc(id) + '"' + (id === cur ? ' class="dark"' : '') + '>' + esc(tagOf(id)) + (id === cur ? ' \u25CF' : '') + '</button>').join('') +
      (cur === '?' ? '<button class="dark" disabled>? \u25CF</button>' : '') +
      '<button data-chip="new" style="flex:1.3">+ New</button>';
  }

  /** The letter on the floating button: the current speaker once there is more than one. */
  function updateBadge() {
    const cur = liveCurrent();
    const b = cur === '?' || liveSpeakers().length > 1 ? (cur === '?' ? '?' : cur) : '';
    if (b !== badgeShown) { badgeShown = b; if (N.setBadge) N.setBadge(b); }
  }

  function markSpeaker(id) {
    if (id === 'new') {
      id = live ? K.newSpeakerId(live) : 'ABCDEFGH'.split('').find((l) => !liveSpeakers().includes(l));
      if (live) K.declareSpeaker(live, id); else declaredEarly.push(id);
    }
    if (pending.spk === id) { pending.spk = null; msg('Speaker mark cancelled'); }
    else if (!pending.spk && id === (live ? K.currentSpeaker(live) : 'A')) { msg(tagOf(id) + ' is already speaking'); return; }
    else {
      pending.spk = id;
      msg(tagOf(id) + (partial ? ' starts at the sentence being heard.' : ' starts at the next sentence.'));
    }
    if (live) saveLiveSoon();
    updateBadge();
    renderAll();
  }

  function renderAll() {
    renderChrome();
    renderPop();
    // While reviewing or editing, the popover's controls replace the bottom buttons.
    if ($('pop').className === 'show') { $('act-prep').hidden = true; $('act-live').hidden = true; $('spk-row').hidden = true; }
    if (N.setFocusable) N.setFocusable(!!renameSpk);
    renderContent();
    if (renameSpk && $('rn')) $('rn').focus();
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
        declaredEarly.splice(0).forEach((id) => K.declareSpeaker(live, id));
        K.applySessionSpeakers(live, sessionSpeakerNames());
      }
      K.addPhrase(live, h, pending);
      pending = { end: null, br: false };
      partial = '';
      updateBadge();
      if (live.phrases.length === 1) save(live); else saveLiveSoon();
      if (!panelOpen) return;
      renderChrome();
      if (tab === 'live') renderContent();
    },
    onSpeakerMark() {
      // Double-tap on the floating button: a new turn, speaker unknown (sorted out in Prep).
      pending.spk = '?';
      updateBadge();
      if (panelOpen) { msg('New speaker marked (?). Say who in Prep.'); renderAll(); }
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
        msg('Copied — long-press the field and Paste. (Turn on Aside Transcribe in Accessibility to push directly.)', true);
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
    confirmClear = false;
    splitSel = null;
    renameSpk = null;
    sessPick = false;
    selWord = null;
    if (t !== 'prep') flagIdx = -1;
    renderAll();
  }

  // Prep ▸ while recording: the recogniser first finishes the sentence being spoken (native
  // cut), that phrase lands in Live, then Live becomes a Prep segment and recording carries on
  // into a new Live segment. Nothing is sent to Claude until the user taps Check, Speakers or Summary.
  let cutting = false, cutTimer = 0;
  function prepClick() {
    if (cutting) return;
    if (!running) { moveToPrep(); return; }
    cutting = true;
    $('move').disabled = true;
    msg('Waiting for the sentence to end\u2026', true);
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
    updateBadge();
    msg('Live cleared \u2014 Undo brings it back');
    renderAll();
  }

  function moveToPrep() {
    if (!live || !live.phrases.length) { msg('Nothing in Live yet'); return; }
    save(live);
    snapshot('state');
    const sg = sessionGroup();
    if (sg) {
      try {
        loadGroups();
        K.assignToGroup(groupsData, sg.id, [live.id]);
        if (N.saveGroups) N.saveGroups(JSON.stringify(groupsData));
      } catch (e) { }
    }
    prep = live;
    st.prepId = live.id;
    live = null;
    st.liveId = null;
    saveState();
    flagIdx = -1; selWord = null; prepView = 'text';
    tab = 'prep';
    updateBadge();
    renderAll();
    processSegment(prep);
  }

  /** Check + Key points for a segment that just arrived in Prep. */
  /**
   * A segment just arrived in Prep. Only on-tablet work happens here (words the speech engine
   * was unsure of, unknown speaker turns); Claude runs only when the user taps Check, Speakers or
   * Summary.
   */
  function processSegment(rec) {
    K.localCheck(rec);
    save(rec);
    const cont = running ? ' Still recording into the next segment.' : '';
    const n = rec.flags.length;
    if (prep === rec && tab === 'prep' && prepView === 'text') flagIdx = n ? 0 : -1;
    msg((n ? 'Moved to Prep: ' + n + ' to review.' : 'Moved to Prep.') + ' Check, Speakers and Summary use Claude when you tap them.' + cont, true);
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

  /** Claude looks for speaker changes that were missed and says who the ? turns are. */
  async function speakersCheck() {
    if (!prep || busy) return;
    snapshot('prep');
    K.unknownTurnFlags(prep);
    if (!settings.hasKey) {
      save(prep);
      const n = prep.flags.filter((f) => f.kind === 'spk').length;
      flagIdx = prep.flags.findIndex((f) => f.kind === 'spk');
      msg((n ? n + ' unknown speaker turns to sort out.' : 'No unknown turns.') + ' Add a Claude API key in the app to find missed changes.', true);
      renderAll();
      return;
    }
    setBusy(true, 'Claude is looking for speaker changes\u2026');
    try {
      const n = K.applySpeakers(prep, await claude(K.speakerRequest(prep, opts(), settings.context)));
      save(prep);
      prepView = 'text';
      flagIdx = prep.flags.findIndex((f) => f.kind === 'spk');
      setBusy(false);
      msg(n ? n + ' speaker suggestions to review' : 'No missed speaker changes found \u2713');
    } catch (e) {
      setBusy(false);
      msg('Speaker check failed: ' + e.message, true);
    }
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

  function popAction(act, suggIdx, b) {
    const rec = tab === 'live' ? live : prep;
    if (b && b.dataset.sess != null && sessPick) {
      st.sessionId = b.dataset.sess || null;
      saveState();
      sessPick = false;
      // The session's speakers name the chips (and the text being recorded now).
      if (live && sessionSpeakerNames().length) { K.applySessionSpeakers(live, sessionSpeakerNames()); save(live); }
      updateBadge();
      const sg = sessionGroup();
      msg(sg ? 'Segments you send to Prep go into “' + sg.name + '”.' : 'No session: segments are not grouped.');
      renderAll();
      return;
    }
    if (act === 'sesscancel') { sessPick = false; renderAll(); return; }
    if (b && b.dataset.split && splitSel && rec) {
      snapshot(tab === 'live' ? 'live' : 'prep');
      let id = b.dataset.split;
      if (id === 'new') id = K.newSpeakerId(rec);
      K.splitTurn(rec, splitSel.p, splitSel.i, id);
      save(rec);
      splitSel = null;
      msg(K.speakerTag(rec, id) + ' starts there.');
      updateBadge();
      renderAll();
      return;
    }
    if (act === 'splitcancel') { splitSel = null; renderAll(); return; }
    if (!prep) return;
    if (b && b.dataset.name && renameSpk) { $('rn').value = b.dataset.name; act = 'rnsave'; }
    if (act === 'rnsave' && renameSpk) {
      snapshot('prep'); K.renameSpeaker(prep, renameSpk, $('rn').value); save(prep);
      renameSpk = null; renderAll(); return;
    }
    if (act === 'rncancel') { renameSpk = null; renderAll(); return; }
    const f = flagIdx >= 0 ? prep.flags[flagIdx] : null;
    if (b && b.dataset.who && f && f.kind === 'spk') {
      snapshot('prep'); K.resolveSpeakerFlag(prep, f, b.dataset.who); save(prep);
    } else if (act === 'notchange' && f && f.kind === 'spk') {
      snapshot('prep'); K.dismissSpeakerFlag(prep, f); save(prep);
    } else if (act === 'spkhere' && selWord) {
      splitSel = selWord; selWord = null; renderAll(); return;
    } else if (suggIdx != null && f) {
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
  $('start').onclick = () => (running ? N.stop() : N.start());
  $('min').onclick = () => N.collapse();
  $('move').onclick = prepClick;
  $('clear').onclick = () => {
    if (!live || !live.phrases.length) { msg('Live is already empty'); return; }
    confirmClear = true;
    renderChrome();
  };
  $('clear-no').onclick = () => { confirmClear = false; renderChrome(); };
  $('clear-yes').onclick = () => { confirmClear = false; clearLive(); };
  $('check').onclick = check;
  $('speakers').onclick = speakersCheck;
  $('sess').onclick = () => { loadGroups(); sessPick = !sessPick; splitSel = null; renderAll(); };
  $('spk-row').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-chip]');
    if (b) markSpeaker(b.dataset.chip);
  });
  $('points').onclick = keyPoints;
  $('view').onclick = () => { prepView = prepView === 'points' ? 'text' : 'points'; flagIdx = -1; selWord = null; renderAll(); };
  $('edit').onclick = () => { if (prep) N.openApp('tools/dictation/index.html#rec=' + prep.id); };
  $('push').onclick = push;
  document.querySelectorAll('.undo').forEach((b) => { b.onclick = doUndo; });
  $('content').addEventListener('click', (e) => {
    const t = e.target.closest('.tag');
    if (t && tab === 'prep' && prep && prepView === 'text') {
      if (t.dataset.tag === '?') {
        K.unknownTurnFlags(prep);
        const fi = prep.flags.findIndex((f) => f.kind === 'spk' && f.unknown && f.p === Number(t.dataset.p));
        if (fi >= 0) { flagIdx = fi; selWord = null; renameSpk = null; renderAll(); }
        return;
      }
      renameSpk = t.dataset.tag; flagIdx = -1; selWord = null; splitSel = null;
      renderAll();
      return;
    }
    const w = e.target.closest('.w');
    if (w && tab === 'live' && live) {
      // Tap a word in Live: a new speaker can start there.
      splitSel = { p: Number(w.dataset.p), i: Number(w.dataset.i) };
      renderAll();
      return;
    }
    if (!w || tab !== 'prep' || prepView !== 'text' || !prep) return;
    renameSpk = null; splitSel = null;
    const p = Number(w.dataset.p), i = Number(w.dataset.i);
    const fi = prep.flags.findIndex((f) => f.p === p && i >= f.ws && i < f.we);
    if (fi >= 0) { flagIdx = fi; selWord = null; }
    else { flagIdx = -1; selWord = { p, i }; }
    renderAll();
  });
  $('pop').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    popAction(b.dataset.act, b.dataset.sugg != null ? Number(b.dataset.sugg) : null, b);
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
      setBadge(b) { self.badge = b; }, setFocusable() { },
      groups() { return ls.getItem('groups') || '{"groups":[]}'; },
      saveGroups(j) { ls.setItem('groups', j); return true; },
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
