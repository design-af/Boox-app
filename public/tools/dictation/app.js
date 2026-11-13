// Aside Transcribe app page.
// Tabs: Library, Setup, Settings. Recordings go into sessions; sessions can be put in groups.
//   Library home  → Unsorted (recordings in no session; assign or delete them)
//                 → Groups, newest first, each collapsible to its sessions (a group page renames,
//                   adds sessions, deletes the group but keeps its sessions)
//                 → Sessions not in a group, newest first
//   a session     → time/title, group, recordings, key points, delete
//   any recording → Recording page (edit text, key points, move, Prep, delete)
// (In the stored data a group is an "event" and a session a "group" entry, for compatibility.)
// Native side: DictationPlugin. Shared logic: kbcore.js.
(function () {
  'use strict';
  const K = window.KBCore;
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.nativePromise);
  const call = (method, args = {}) => Cap.nativePromise('Dictation', method, args);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const errText = (e) => (e && e.message) || String(e);
  const say = (id, t) => { $(id).textContent = t || ''; };

  let status = null;
  let settingsLoaded = false;
  let items = [];                              // recording metadata from the native list
  let data = { groups: [], events: [] };       // groups.json
  let st = {};                                 // { liveId, prepId, sessionId }

  // Navigation: the current screen plus a stack to go back through.
  let view = 'library';
  let viewId = null;                           // event / group / recording id for the screen
  const stack = [];
  let current = null;                          // recording open on the Recording screen
  let assignIds = [];                          // recordings being assigned
  let uSelecting = false;
  const uPicked = new Set();
  const pPicked = new Set();
  let syImages = [];
  let syData = null;

  const opts = () => ({ cap: !status || status.settings.cap !== false, autoPeriod: !status || status.settings.autoPeriod !== false });
  const context = () => (status && status.settings.context) || '';
  const hasKey = () => !!(status && status.settings.hasKey);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

  function when(t, withYear) {
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined }) +
      ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const dayKey = (t) => new Date(t).toDateString();
  const dayLabel = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  // ---------------------------------------------------------------- data

  async function loadData() {
    try { items = JSON.parse((await call('list')).json || '[]'); } catch (e) { items = []; }
    try { data = JSON.parse((await call('groups')).json || '{"groups":[]}'); } catch (e) { data = { groups: [] }; }
    try { st = JSON.parse((await call('state')).json || '{}'); } catch (e) { st = {}; }
    if (!Array.isArray(data.groups)) data.groups = [];
    K.ensureEvents(data);
    const ids = new Set(items.map((m) => m.id));
    data.groups.forEach((g) => { g.ids = (g.ids || []).filter((id) => ids.has(id)); });
  }
  const saveGroups = () => call('saveGroups', { json: JSON.stringify(data) });
  const meta = (id) => items.find((m) => m.id === id);
  const groupById = (id) => data.groups.find((g) => g.id === id) || null;
  const eventById = (id) => data.events.find((e) => e.id === id) || null;
  const unsorted = () => K.unsortedIds(data, items.map((m) => m.id)).map(meta).filter(Boolean);
  const recCount = (gs) => gs.reduce((n, g) => n + g.ids.length, 0);
  async function loadRec(id) { return JSON.parse((await call('load', { id })).json); }

  async function removeRecordings(ids) {
    st = JSON.parse((await call('state')).json || '{}');
    for (const id of ids) {
      if (st.liveId === id) st.liveId = null;
      if (st.prepId === id) st.prepId = null;
      try { await call('remove', { id }); } catch (e) { }
    }
    K.removeFromGroups(data, ids);
    await saveGroups();
    await call('setState', { json: JSON.stringify(st) });
  }

  // ---------------------------------------------------------------- navigation

  const SECTIONS = ['library', 'setup', 'settings', 'unsorted', 'event', 'group', 'assign', 'pick', 'symp', 'rec'];
  const TABS = ['library', 'setup', 'settings'];
  const TITLES = { unsorted: 'Unsorted', event: 'Group', assign: 'Assign to…', pick: 'Add recordings', symp: 'New group', rec: 'Recording' };

  function show(v, id) {
    view = v;
    viewId = id == null ? null : id;
    $('tabs').hidden = !TABS.includes(v);
    SECTIONS.forEach((x) => { $('v-' + x).hidden = x !== v; });
    TABS.forEach((t) => $('tab-' + t).setAttribute('aria-selected', String(v === t)));
    if (TABS.includes(v)) { $('heading').textContent = 'Aside Transcribe'; $('back').textContent = '← Tools'; }
    else {
      const g = v === 'group' ? groupById(viewId) : null;
      $('heading').textContent = v === 'group' ? 'Session' : TITLES[v];
      $('back').textContent = '← Back';
    }
    $('middle').scrollTop = 0;
    const hash = v === 'rec' && viewId ? '#rec=' + viewId : TABS.includes(v) ? '#' + v : location.hash;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  /** Opens a screen, remembering where we came from. */
  function go(v, id) {
    stack.push({ v: view, id: viewId });
    show(v, id);
  }

  async function back() {
    if (view === 'rec') current = null;
    const prev = stack.pop();
    if (!prev) { location.href = '../../index.html'; return; }
    await loadData();
    show(prev.v, prev.id);
  }

  function render() {
    if (view === 'library') renderHome();
    else if (view === 'unsorted') renderUnsorted();
    else if (view === 'event') renderEvent();
    else if (view === 'group') renderGroup();
    else if (view === 'assign') renderAssign();
    else if (view === 'pick') renderPick();
  }

  // ---------------------------------------------------------------- rows

  function recRow(m, o) {
    o = o || {};
    const bits = [when(m.created || m.updated), m.words + ' words'];
    if (m.hasSummary) bits.push('key points');
    if (m.flags) bits.push(m.flags + ' to review');
    if (m.pushed) bits.push('pushed ✓');
    const where = m.id === st.liveId ? 'LIVE · ' : m.id === st.prepId ? 'IN PREP · ' : '';
    const sel = !!o.select;
    const on = sel && o.picked && o.picked.has(m.id);
    return '<li class="' + (on ? 'picked' : '') + '"><button class="rowbtn" data-id="' + esc(m.id) + '"' + (sel ? ' aria-pressed="' + on + '"' : '') + '>' +
      (sel ? '<span class="box" aria-hidden="true">' + (on ? '✓' : '') + '</span>' : '') +
      '<span class="meta"><span class="t">' + esc(m.title || K.defaultTitle({ created: m.created })) + '</span><span class="m">' + where + bits.join(' · ') + '</span></span></button>' +
      (o.assign ? '<button class="side" data-assign="' + esc(m.id) + '">Assign</button>' : '') +
      (o.remove ? '<button class="side" data-remove="' + esc(m.id) + '">Remove</button>' : '') + '</li>';
  }

  function navRow(attr, id, title, sub) {
    return '<li><button class="rowbtn" ' + attr + '="' + esc(id) + '"><span class="meta"><span class="t">' + esc(title) +
      '</span><span class="m">' + esc(sub) + '</span></span><span class="chev" aria-hidden="true">›</span></button></li>';
  }

  // ---------------------------------------------------------------- Library home

  /** Latest activity of a session: made, edited, or a recording added. */
  function sessionLatest(g) {
    let t = Math.max(g.created || 0, g.updated || 0);
    g.ids.forEach((id) => { const m = meta(id); if (m) t = Math.max(t, m.created || 0, m.updated || 0); });
    return t;
  }
  const eventLatest = (e) => Math.max(e.created || 0, ...K.eventSessions(data, e.id).map(sessionLatest));

  function sessionSub(g) {
    const sub = [plural(g.ids.length, 'recording', 'recordings')];
    if (g.summary) sub.push('key points ✓');
    const t = sessionLatest(g);
    if (t) sub.push(when(t));
    return sub.join(' · ');
  }

  // Which groups are folded, remembered on this tablet. New groups start open.
  function folded() { try { return JSON.parse(localStorage.getItem('aside.folded') || '{}'); } catch (e) { return {}; } }
  function setFolded(id, on) {
    const f = folded();
    if (on) f[id] = true; else delete f[id];
    try { localStorage.setItem('aside.folded', JSON.stringify(f)); } catch (e) { }
  }

  function renderHome() {
    const out = [];
    const u = unsorted();
    const newest = u.reduce((t, m) => Math.max(t, m.created || 0), 0);
    out.push('<ul class="lib boxed inbox" style="margin-top:4px">' + navRow('data-nav', 'unsorted', 'Unsorted',
      u.length ? plural(u.length, 'recording', 'recordings') + ' not in a session · newest ' + when(newest) : 'Nothing to sort') + '</ul>');

    // Groups, newest activity first, each folding open to its sessions.
    const f = folded();
    const evs = data.events.slice().sort((a, b) => eventLatest(b) - eventLatest(a));
    out.push('<div class="home-h">Groups</div>');
    if (evs.length) {
      evs.forEach((e) => {
        const ss = K.eventSessions(data, e.id);
        out.push('<section class="grp' + (f[e.id] ? ' closed' : '') + '"><div class="grp-h"><button class="open" data-toggle="' + esc(e.id) + '" aria-expanded="' + !f[e.id] + '">' +
          '<span class="t">' + esc(e.name) + '</span><span class="m">' + plural(ss.length, 'session', 'sessions') + ' · ' + plural(recCount(ss), 'recording', 'recordings') + '</span></button>' +
          '<button class="kp" data-event="' + esc(e.id) + '">Edit</button></div>' +
          (ss.length ? '<ul class="lib">' + ss.map((g) => navRow('data-group', g.id, g.name, sessionSub(g))).join('') + '</ul>'
            : '<p class="empty" style="padding:12px">No sessions yet. Tap Edit, then + Add session.</p>') + '</section>');
      });
    } else out.push('<p class="empty">None yet. Tap New group to set one up from a programme, or type it in.</p>');

    // Sessions not in a group, newest first.
    const loose = data.groups.filter((g) => !g.eventId).sort((a, b) => sessionLatest(b) - sessionLatest(a));
    if (loose.length) {
      out.push('<div class="home-h">Sessions not in a group</div><ul class="lib boxed">' +
        loose.map((g) => navRow('data-group', g.id, g.name, sessionSub(g))).join('') + '</ul>');
    }
    $('lib-home').innerHTML = out.join('');
  }

  // ---------------------------------------------------------------- Unsorted

  function renderUnsorted() {
    const u = unsorted().sort((a, b) => (b.created || 0) - (a.created || 0));
    $('u-count').textContent = u.length ? plural(u.length, 'recording', 'recordings') : '';
    $('u-bar').hidden = uSelecting;
    $('u-selbar').hidden = !uSelecting;
    $('u-selcount').textContent = uPicked.size + ' selected';
    $('u-assign').disabled = $('u-delete').disabled = uPicked.size === 0;
    if (!u.length) { $('u-list').innerHTML = '<p class="empty">Everything is in a session or group.</p>'; return; }
    const out = [];
    let day = null, buf = [];
    const flush = () => { if (buf.length) { out.push('<ul class="lib boxed">' + buf.join('') + '</ul>'); buf = []; } };
    for (const m of u) {
      const k = dayKey(m.created || m.updated);
      if (k !== day) { flush(); day = k; out.push('<div class="day">' + esc(dayLabel(m.created || m.updated)) + '</div>'); }
      buf.push(recRow(m, uSelecting ? { select: true, picked: uPicked } : { assign: true }));
    }
    flush();
    $('u-list').innerHTML = out.join('');
  }

  // ---------------------------------------------------------------- Symposium

  function renderEvent() {
    const e = eventById(viewId);
    if (!e) { $('e-list').innerHTML = ''; return; }
    if (document.activeElement !== $('e-name')) $('e-name').value = e.name;
    const ss = K.eventSessions(data, e.id);
    $('e-meta').textContent = plural(ss.length, 'session', 'sessions') + ' · ' + plural(recCount(ss), 'recording', 'recordings');
    $('e-list').innerHTML = ss.length ? ss.map((g) => {
      const sub = [];
      if (g.speakers && g.speakers.length) sub.push(g.speakers.join(', '));
      sub.push(plural(g.ids.length, 'recording', 'recordings'));
      if (g.summary) sub.push('key points ✓');
      return navRow('data-group', g.id, g.name, sub.join(' · '));
    }).join('') : '<li><p class="empty" style="padding:12px">No sessions yet. Tap + Add session.</p></li>';
    $('e-delete').textContent = 'Delete group…';
  }

  // ---------------------------------------------------------------- Session / group

  function renderGroup() {
    const g = groupById(viewId);
    if (!g) return;
    const e = g.eventId ? eventById(g.eventId) : null;
    $('g-event').textContent = e ? e.name : 'Not in a group';
    if (document.activeElement !== $('g-time')) $('g-time').value = g.time || '';
    // Older sessions only had a name: show it as the title.
    if (document.activeElement !== $('g-title')) $('g-title').value = g.title || (!g.time ? g.name : '');
    if (document.activeElement !== $('g-speakers')) $('g-speakers').value = (g.speakers || []).join(', ');
    const ppl = (g.people || []).filter((p) => (g.speakers || []).includes(p.name) && (p.role || p.org));
    $('g-people').textContent = ppl.map(K.personLine).join(' · ');
    $('g-people').hidden = !ppl.length;
    $('g-groupsel').innerHTML = '<option value="">Not in a group</option>' +
      data.events.slice().sort((a, b) => eventLatest(b) - eventLatest(a)).map((x) => '<option value="' + esc(x.id) + '"' + (x.id === g.eventId ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') +
      '<option value="__new">New group…</option>';
    if (document.activeElement !== $('g-points')) $('g-points').value = g.summary || '';
    const ms = g.ids.map(meta).filter(Boolean).sort((a, b) => (a.created || 0) - (b.created || 0));
    const words = ms.reduce((n, m) => n + (m.words || 0), 0);
    $('g-meta').textContent = ms.length ? '· ' + plural(ms.length, 'recording', 'recordings') + ' · ' + words + ' words' : '';
    $('g-list').innerHTML = ms.length ? ms.map((m) => recRow(m, { remove: true })).join('') : '<li><p class="empty" style="padding:12px">None yet. Tap + Add recordings, or send segments here from the floating panel’s Session picker.</p></li>';
    $('g-gen').disabled = !ms.length;
    $('g-delete').textContent = 'Delete session…';
  }

  async function saveSessionFields() {
    const g = groupById(viewId);
    if (!g) return;
    K.updateSession(g, { time: $('g-time').value, title: $('g-title').value, speakers: $('g-speakers').value });
    await saveGroups();
    say('msg-g', 'Saved.');
  }

  async function groupRecs(g) {
    const out = [];
    for (const id of g.ids) { try { out.push(await loadRec(id)); } catch (e) { } }
    return out.sort((a, b) => (a.created || 0) - (b.created || 0));
  }

  async function groupKeyPoints() {
    const g = groupById(viewId);
    if (!g) return;
    if (!hasKey()) { say('msg-g', 'Key points need a Claude API key (Settings tab).'); return; }
    $('g-gen').disabled = true;
    say('msg-g', 'Writing key points for ' + plural(g.ids.length, 'recording', 'recordings') + '…');
    try {
      const recs = await groupRecs(g);
      if (!recs.length) throw new Error('no recordings here yet');
      const res = (await call('claude', { body: JSON.stringify(K.groupSummaryRequest(g.name, recs, opts(), context())) })).json;
      const t = g.title;
      K.applySummary(g, res);
      g.title = t; // sessions keep their own title
      g.updated = Date.now();
      await saveGroups();
      if (view === 'group' && viewId === g.id) $('g-points').value = g.summary;
      say('msg-g', 'Key points written and saved.');
    } catch (e) { say('msg-g', 'Key points failed: ' + errText(e)); }
    $('g-gen').disabled = false;
  }

  async function groupToPrep() {
    const g = groupById(viewId);
    const text = $('g-points').value.trim();
    if (!g || !text) { say('msg-g', 'No key points yet.'); return; }
    g.summary = text;
    const rec = K.newRecording();
    rec.title = 'Key points — ' + g.name;
    K.setEditedText(rec, K.groupKeyPointsText(g));
    rec.summary = text;
    try {
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      K.assignToGroup(data, g.id, [rec.id]);
      await saveGroups();
      st = JSON.parse((await call('state')).json || '{}');
      st.prepId = rec.id;
      await call('setState', { json: JSON.stringify(st) });
      await loadData();
      renderGroup();
      say('msg-g', 'In Prep. Open the floating panel, tap into your notes and Push.');
    } catch (e) { say('msg-g', 'Failed: ' + errText(e)); }
  }

  async function groupAllText(g) {
    const parts = [g.name];
    if ($('g-points').value.trim()) parts.push('Key points\n' + $('g-points').value.trim());
    for (const r of await groupRecs(g)) parts.push(K.titleOf(r) + '\n' + K.plain(r, opts()));
    return parts.join('\n\n');
  }

  // ---------------------------------------------------------------- Assign / pick

  function renderAssign() {
    $('a-what').textContent = 'Assign ' + plural(assignIds.length, 'recording', 'recordings') + ' to:';
    const out = [];
    const loose = data.groups.filter((g) => !g.eventId).sort((a, b) => sessionLatest(b) - sessionLatest(a));
    if (loose.length) out.push('<div class="assign-ev">Not in a group</div><div class="dest">' + loose.map((g) => '<button data-to="' + esc(g.id) + '">' + esc(g.name) + '</button>').join('') + '</div>');
    data.events.slice().sort((a, b) => eventLatest(b) - eventLatest(a)).forEach((e) => {
      const ss = K.eventSessions(data, e.id);
      if (!ss.length) return;
      out.push('<div class="assign-ev">' + esc(e.name) + '</div><div class="dest">' +
        ss.map((g) => '<button data-to="' + esc(g.id) + '">' + esc(g.name) + '</button>').join('') + '</div>');
    });
    if (!out.length) out.push('<p class="empty">No sessions yet. Make a new session below.</p>');
    $('a-list').innerHTML = out.join('');
    $('a-newname').value = '';
    say('msg-a', '');
  }

  async function assignTo(gid) {
    const g = groupById(gid);
    if (!g) return;
    K.assignToGroup(data, gid, assignIds);
    await saveGroups();
    const n = assignIds.length;
    assignIds = [];
    uPicked.clear();
    uSelecting = false;
    await back();
    const id = view === 'unsorted' ? 'msg-u' : view === 'rec' ? 'msg-d' : 'msg-lib';
    say(id, plural(n, 'recording', 'recordings') + ' assigned to “' + g.name + '”.');
  }

  function renderPick() {
    const u = unsorted().sort((a, b) => (b.created || 0) - (a.created || 0));
    $('p-list').innerHTML = u.length ? u.map((m) => recRow(m, { select: true, picked: pPicked })).join('') : '<li><p class="empty" style="padding:12px">Nothing in Unsorted.</p></li>';
    $('p-ok').textContent = pPicked.size ? 'Add ' + pPicked.size : 'Add';
    $('p-ok').disabled = !pPicked.size;
  }

  // ---------------------------------------------------------------- Recording

  function groupSelectHtml(selected) {
    const opt = (g) => '<option value="' + esc(g.id) + '"' + (g.id === selected ? ' selected' : '') + '>' + esc(g.name) + '</option>';
    const out = ['<option value="">Unsorted</option>'];
    const loose = data.groups.filter((g) => !g.eventId).sort((a, b) => sessionLatest(b) - sessionLatest(a));
    if (loose.length) out.push('<optgroup label="Not in a group">' + loose.map(opt).join('') + '</optgroup>');
    data.events.slice().sort((a, b) => eventLatest(b) - eventLatest(a)).forEach((e) => {
      const ss = K.eventSessions(data, e.id);
      if (ss.length) out.push('<optgroup label="' + esc(e.name) + '">' + ss.map(opt).join('') + '</optgroup>');
    });
    out.push('<option value="__new">New session…</option>');
    return out.join('');
  }

  async function openRec(id) {
    let rec;
    try { rec = await loadRec(id); } catch (e) { say('msg-lib', 'Could not open recording: ' + errText(e)); return; }
    current = rec;
    go('rec', id);
    $('d-title').value = current.title || '';
    $('d-title').placeholder = K.defaultTitle(current);
    $('d-text').value = K.plain(current, opts());
    $('d-text').dataset.orig = $('d-text').value;
    $('d-points').value = current.summary || '';
    const g = K.groupOf(data, current.id);
    $('d-group').innerHTML = groupSelectHtml(g ? g.id : '');
    $('d-newgroup').hidden = true;
    $('d-newgroup').value = '';
    $('d-meta').textContent = when(current.created, true) + ' · ' + K.wordCount(current) + ' words' +
      (current.flags && current.flags.length ? ' · ' + current.flags.length + ' flagged words to review in the panel' : '') +
      (current.pushed ? ' · pushed ' + when(current.pushed) : '');
    say('msg-d', '');
    $('d-delete').textContent = 'Delete…';
  }

  function collectRec() {
    if (!current) return null;
    current.title = $('d-title').value.trim();
    if ($('d-text').value !== $('d-text').dataset.orig) {
      K.setEditedText(current, $('d-text').value);
      $('d-text').dataset.orig = $('d-text').value;
    }
    current.summary = $('d-points').value.trim();
    current.updated = Date.now();
    return current;
  }

  async function saveRec(toPrep) {
    const rec = collectRec();
    if (!rec) return;
    try {
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      let gid = $('d-group').value;
      if (gid === '__new') gid = K.newSession(data, { title: $('d-newgroup').value.trim() || 'New session' }).id;
      if (gid) K.assignToGroup(data, gid, [rec.id]); else K.removeFromGroups(data, [rec.id]);
      await saveGroups();
      if (toPrep) {
        st = JSON.parse((await call('state')).json || '{}');
        if (st.liveId === rec.id) st.liveId = null;
        st.prepId = rec.id;
        await call('setState', { json: JSON.stringify(st) });
      }
      await loadData();
      $('d-group').innerHTML = groupSelectHtml(gid || '');
      $('d-newgroup').hidden = true;
      say('msg-d', toPrep ? 'Saved and put in Prep. Open the floating panel to Push it.' : 'Saved.');
    } catch (e) { say('msg-d', 'Save failed: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- New symposium

  function resetSymp() {
    syImages = [];
    syData = null;
    $('sy-url').value = '';
    $('sy-imgs').textContent = 'No images yet. Add every page of the programme.';
    $('sy-review').hidden = true;
    say('msg-sy', '');
  }

  /** Photos are shrunk (longest side 1568 px, JPEG) before going to Claude. */
  function shrinkImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1568 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        const g = c.getContext('2d');
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ media_type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
      img.src = url;
    });
  }

  function pageText(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,noscript,svg,iframe').forEach((n) => n.remove());
    const title = (doc.querySelector('title') || {}).textContent || '';
    const text = (doc.body ? doc.body.textContent : '').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
    return (title ? title.trim() + '\n' : '') + text;
  }

  async function readSymposium() {
    if (!hasKey()) { say('msg-sy', 'Reading the programme needs a Claude API key (Settings tab). Or tap Type it in myself.'); return; }
    const url = $('sy-url').value.trim();
    if (!syImages.length && !url) { say('msg-sy', 'Add a photo or screenshot, or paste the event page link.'); return; }
    $('sy-read').disabled = true;
    try {
      let text = '';
      if (url) {
        say('msg-sy', 'Opening the page…');
        const r = await call('fetchPage', { url });
        text = pageText(r.html || '');
        if (text.length < 200 && !syImages.length) throw new Error('that page shows almost no text here (it may need a browser). Take a screenshot of it instead.');
      }
      say('msg-sy', 'Claude is reading the programme…');
      const res = (await call('claude', { body: JSON.stringify(K.symposiumRequest(syImages, text, url)) })).json;
      syData = K.parseSymposium(res);
      if (!syData.sessions.length) throw new Error('no sessions found. Try a clearer photo or the full agenda page.');
      say('msg-sy', syData.sessions.length + ' sessions found. Check them below, then Create sessions.');
      renderSymp();
      $('sy-review-h').textContent = 'Check what was read';
    } catch (e) { say('msg-sy', 'Could not read it: ' + errText(e)); }
    $('sy-read').disabled = false;
  }

  function renderSymp() {
    $('sy-review').hidden = false;
    $('sy-event').value = syData.event + (syData.date && syData.event.indexOf(syData.date) < 0 ? ' · ' + syData.date : '');
    syData.date = '';
    $('sy-list').innerHTML = syData.sessions.map((x, i) =>
      '<div class="sess" data-i="' + i + '">' +
      '<input type="text" aria-label="Time" placeholder="Time" data-f="time" value="' + esc(x.time) + '">' +
      '<input type="text" aria-label="Title" placeholder="Title" data-f="title" value="' + esc(x.title) + '">' +
      '<input class="who" type="text" aria-label="Speakers" placeholder="Speakers\u2019 names, separated by commas" data-f="speakers" value="' + esc(x.speakers.join(', ')) + '">' +
      ((x.people || []).some((p) => p.role || p.org) ? '<span class="hint who">' + esc((x.people || []).filter((p) => p.role || p.org).map(K.personLine).join(' \u00B7 ')) + '</span>' : '') +
      '<button data-rm="' + i + '">Remove</button></div>').join('');
  }

  function collectSymp() {
    if (!syData) syData = { event: '', date: '', sessions: [] };
    syData.event = $('sy-event').value.trim();
    const before = syData.sessions || [];
    syData.sessions = Array.from($('sy-list').querySelectorAll('.sess')).map((el) => {
      const old = before[Number(el.dataset.i)] || {};
      const speakers = el.querySelector('[data-f="speakers"]').value.split(',').map((t) => K.shortName(t)).filter(Boolean);
      // Keep the role/company Claude read for any name that is still there.
      const people = speakers.map((n) => (old.people || []).find((p) => p.name === n) || { name: n, role: '', org: '' });
      return { time: el.querySelector('[data-f="time"]').value.trim(), title: el.querySelector('[data-f="title"]').value.trim(), speakers, people, room: '' };
    });
  }

  async function createSymposium() {
    collectSymp();
    const list = syData.sessions.filter((x) => x.title || x.speakers.length || x.time);
    await loadData();
    let eventId;
    if (list.length) {
      const made = K.makeSessionGroups(data, { event: syData.event || 'Group', date: '', sessions: list });
      eventId = made[0].eventId;
    } else eventId = K.newEvent(data, syData.event || 'Group').id;
    try {
      await saveGroups();
      resetSymp();
      stack.pop(); // leave New symposium; Back from the symposium goes to the Library
      stack.push({ v: 'library', id: null });
      show('event', eventId);
      say('msg-e', 'Created. Pick a session in the floating panel while you record.');
    } catch (e) { say('msg-sy', 'Could not save: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- setup + settings

  function mark(stepId, done, n) {
    $(stepId).classList.toggle('done', !!done);
    $(stepId).querySelector('.mark').textContent = done ? '✓' : n;
  }

  function renderStatus(s) {
    status = s;
    mark('s-mic', s.mic, 1);
    $('b-mic').textContent = s.mic ? 'Allowed' : 'Allow';
    $('b-mic').disabled = !!s.mic;
    mark('s-eng', s.recognizer, 2);
    $('h-eng').textContent = s.recognizer
      ? (s.onDevice ? 'Found, including on-device (works offline).' : 'Found (online; needs Wi-Fi or a hotspot).')
      : 'None found. Install the Google app or “Speech Recognition & Synthesis from Google”.';
    mark('s-ovl', s.overlay, 3);
    $('b-ovl').textContent = s.overlay ? 'Allowed' : 'Allow';
    $('b-ovl').disabled = !!s.overlay;
    mark('s-acc', s.accessibility, 4);
    mark('s-key', s.settings.hasKey, 5);
    $('h-key').textContent = s.settings.hasKey ? 'Saved on this tablet. Paste a new one to replace it.' : 'Stored only on this tablet. From console.anthropic.com.';
    $('b-bubble').textContent = s.bubble ? 'Hide floating button' : 'Show floating button';
    $('b-bubble').classList.toggle('primary', !s.bubble);
    if (!settingsLoaded) {
      settingsLoaded = true;
      const t = s.settings;
      $('engine').value = t.engine || 'auto';
      $('mute').checked = t.mute !== false;
      $('keepAwake').checked = t.keepAwake !== false;
      $('cap').checked = t.cap !== false;
      $('autoPeriod').checked = t.autoPeriod !== false;
      $('lang').value = t.lang || '';
      $('model').value = t.model || 'claude-sonnet-5-5';
      $('context').value = t.context || '';
    }
  }

  async function refresh() {
    try { renderStatus(await call('status')); } catch (e) { say('msg-set', 'Status failed: ' + errText(e)); }
  }

  async function saveSettings(extra) {
    try {
      renderStatus(await call('setSettings', Object.assign({
        engine: $('engine').value, mute: $('mute').checked, keepAwake: $('keepAwake').checked, cap: $('cap').checked, autoPeriod: $('autoPeriod').checked,
        lang: $('lang').value.trim(), model: $('model').value, context: $('context').value,
      }, extra || {})));
      say('msg-set', 'Saved.');
    } catch (e) { say('msg-set', 'Save failed: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- wiring

  if (!native) { $('notnative').hidden = false; return; }

  $('back').addEventListener('click', (e) => { e.preventDefault(); back(); });
  TABS.forEach((t) => $('tab-' + t).addEventListener('click', async () => {
    stack.length = 0;
    if (t === 'library') await loadData(); else refresh();
    show(t);
  }));

  // Library home
  $('b-newsymp').onclick = () => { resetSymp(); go('symp'); };
  $('b-newsession').onclick = async () => {
    const g = K.newSession(data, {});
    await saveGroups();
    go('group', g.id);
    $('g-title').select();
  };
  $('lib-home').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.toggle) { const sec = b.closest('.grp'); const shut = !sec.classList.contains('closed'); setFolded(b.dataset.toggle, shut); sec.classList.toggle('closed', shut); b.setAttribute('aria-expanded', String(!shut)); return; }
    if (b.dataset.nav === 'unsorted') { uSelecting = false; uPicked.clear(); go('unsorted'); }
    else if (b.dataset.event) go('event', b.dataset.event);
    else if (b.dataset.group) go('group', b.dataset.group);
  });

  // Unsorted
  $('u-select').onclick = () => { uSelecting = true; uPicked.clear(); renderUnsorted(); };
  $('u-done').onclick = () => { uSelecting = false; uPicked.clear(); renderUnsorted(); };
  $('u-assign').onclick = () => { assignIds = Array.from(uPicked); go('assign'); };
  let uDelArmed = 0;
  $('u-delete').onclick = async () => {
    if (Date.now() - uDelArmed > 4000) { uDelArmed = Date.now(); $('u-delete').textContent = 'Tap again to delete'; return; }
    $('u-delete').textContent = 'Delete…';
    const n = uPicked.size;
    await removeRecordings(Array.from(uPicked));
    uPicked.clear(); uSelecting = false;
    await loadData();
    renderUnsorted();
    say('msg-u', plural(n, 'recording', 'recordings') + ' deleted.');
  };
  $('u-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.assign) { assignIds = [b.dataset.assign]; go('assign'); return; }
    if (!b.dataset.id) return;
    if (uSelecting) { if (uPicked.has(b.dataset.id)) uPicked.delete(b.dataset.id); else uPicked.add(b.dataset.id); renderUnsorted(); }
    else openRec(b.dataset.id);
  });

  // Symposium
  $('e-name').addEventListener('change', async () => { K.renameEvent(data, viewId, $('e-name').value); await saveGroups(); say('msg-e', 'Renamed.'); });
  $('e-add').onclick = async () => {
    const g = K.addSession(data, viewId, {});
    await saveGroups();
    go('group', g.id);
    $('g-title').focus();
  };
  $('e-list').addEventListener('click', (e) => { const b = e.target.closest('button[data-group]'); if (b) go('group', b.dataset.group); });
  let eDelArmed = 0;
  $('e-delete').onclick = async () => {
    if (Date.now() - eDelArmed > 4000) { eDelArmed = Date.now(); $('e-delete').textContent = 'Tap again to delete the group'; return; }
    K.dissolveEvent(data, viewId);
    await saveGroups();
    await back();
    say('msg-lib', 'Group deleted. Its sessions are under Sessions not in a group.');
  };

  // Session / group
  ['g-time', 'g-title', 'g-speakers'].forEach((id) => $(id).addEventListener('change', saveSessionFields));
  $('g-groupsel').addEventListener('change', async () => {
    let eid = $('g-groupsel').value;
    if (eid === '__new') eid = K.newEvent(data, 'New group').id;
    K.setSessionEvent(data, viewId, eid);
    await saveGroups();
    renderGroup();
    say('msg-g', eid ? 'Moved to “' + eventById(eid).name + '”.' + ($('g-groupsel').value === eid && eventById(eid).name === 'New group' ? ' Rename it from the Library (Edit).' : '') : 'Taken out of its group.');
  });
  $('g-points').addEventListener('change', async () => { const g = groupById(viewId); if (g) { g.summary = $('g-points').value.trim(); await saveGroups(); say('msg-g', 'Saved.'); } });
  $('g-addrecs').onclick = () => { pPicked.clear(); go('pick', viewId); };
  $('g-gen').onclick = groupKeyPoints;
  $('g-pcopy').onclick = async () => {
    const g = groupById(viewId);
    if (!g || !$('g-points').value.trim()) { say('msg-g', 'No key points yet.'); return; }
    await call('copyText', { text: K.groupKeyPointsText({ name: g.name, summary: $('g-points').value }) });
    say('msg-g', 'Key points copied.');
  };
  $('g-prep').onclick = groupToPrep;
  $('g-copyall').onclick = async () => { const g = groupById(viewId); if (g) { await call('copyText', { text: await groupAllText(g) }); say('msg-g', 'Everything copied.'); } };
  $('g-share').onclick = async () => { const g = groupById(viewId); if (g) call('shareText', { text: await groupAllText(g), subject: g.name }).catch((e) => say('msg-g', errText(e))); };
  let gDelArmed = 0;
  $('g-delete').onclick = async () => {
    const g = groupById(viewId);
    if (!g) return;
    if (Date.now() - gDelArmed > 4000) { gDelArmed = Date.now(); $('g-delete').textContent = 'Tap again to delete'; return; }
    K.deleteGroup(data, g.id);
    await saveGroups();
    await back();
  };
  $('g-list').addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.remove) { K.removeFromGroups(data, [b.dataset.remove]); await saveGroups(); renderGroup(); say('msg-g', 'Moved to Unsorted.'); }
    else if (b.dataset.id) openRec(b.dataset.id);
  });

  // Assign / pick
  $('a-list').addEventListener('click', (e) => { const b = e.target.closest('button[data-to]'); if (b) assignTo(b.dataset.to); });
  $('a-new').onclick = async () => {
    const g = K.newSession(data, { title: $('a-newname').value.trim() || 'New session' });
    await saveGroups();
    assignTo(g.id);
  };
  $('p-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    if (pPicked.has(b.dataset.id)) pPicked.delete(b.dataset.id); else pPicked.add(b.dataset.id);
    renderPick();
  });
  $('p-cancel').onclick = () => back();
  $('p-ok').onclick = async () => {
    K.assignToGroup(data, viewId, Array.from(pPicked));
    await saveGroups();
    const n = pPicked.size;
    pPicked.clear();
    await back();
    say('msg-g', plural(n, 'recording', 'recordings') + ' added.');
  };

  // Recording
  $('d-group').onchange = () => { $('d-newgroup').hidden = $('d-group').value !== '__new'; if (!$('d-newgroup').hidden) $('d-newgroup').focus(); };
  $('d-copy').onclick = async () => { await call('copyText', { text: $('d-text').value }); say('msg-d', 'Transcript copied.'); };
  $('d-share').onclick = () => {
    const t = $('d-text').value + ($('d-points').value.trim() ? '\n\nKey points\n' + $('d-points').value.trim() : '');
    call('shareText', { text: t, subject: $('d-title').value || $('d-title').placeholder }).catch((e) => say('msg-d', errText(e)));
  };
  $('d-pcopy').onclick = async () => {
    if (!$('d-points').value.trim()) { say('msg-d', 'No key points yet.'); return; }
    await call('copyText', { text: $('d-points').value.trim() });
    say('msg-d', 'Key points copied.');
  };
  $('d-gen').onclick = async () => {
    const rec = collectRec();
    if (!rec) return;
    if (!hasKey()) { say('msg-d', 'Key points need a Claude API key (Settings tab).'); return; }
    $('d-gen').disabled = true;
    say('msg-d', 'Writing key points…');
    try {
      const res = (await call('claude', { body: JSON.stringify(K.summaryRequest(rec, opts(), context())) })).json;
      K.applySummary(rec, res);
      $('d-points').value = rec.summary;
      if (!$('d-title').value) $('d-title').value = rec.title || '';
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      say('msg-d', 'Key points written and saved.');
    } catch (e) { say('msg-d', 'Key points failed: ' + errText(e)); }
    $('d-gen').disabled = false;
  };
  $('d-save').onclick = () => saveRec(false);
  $('d-prep').onclick = () => saveRec(true);
  let dDelArmed = 0;
  $('d-delete').onclick = async () => {
    if (Date.now() - dDelArmed > 4000) { dDelArmed = Date.now(); $('d-delete').textContent = 'Tap again to delete'; return; }
    try {
      await removeRecordings([current.id]);
      await back();
    } catch (e) { say('msg-d', errText(e)); }
  };

  // New symposium
  $('sy-manual').onclick = () => {
    syData = { event: '', date: '', sessions: [{ time: '', title: '', speakers: [], room: '' }] };
    renderSymp();
    $('sy-review-h').textContent = 'Event and sessions';
    $('sy-event').placeholder = 'Event name';
    $('sy-event').focus();
  };
  $('sy-pick').addEventListener('change', async () => {
    const files = Array.from($('sy-pick').files || []);
    for (const f of files) { try { syImages.push(await shrinkImage(f)); } catch (e) { say('msg-sy', 'Could not read ' + f.name); } }
    $('sy-pick').value = '';
    $('sy-imgs').textContent = syImages.length ? plural(syImages.length, 'image', 'images') + ' added.' : 'No images yet.';
  });
  $('sy-reset').onclick = resetSymp;
  $('sy-read').onclick = readSymposium;
  $('sy-add').onclick = () => { collectSymp(); syData.sessions.push({ time: '', title: '', speakers: [], room: '' }); renderSymp(); };
  $('sy-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-rm]');
    if (!b) return;
    collectSymp(); syData.sessions.splice(Number(b.dataset.rm), 1); renderSymp();
  });
  $('sy-create').onclick = createSymposium;

  // Setup
  $('b-bubble').onclick = async () => {
    try {
      if (status && status.bubble) { await call('hideBubble'); setTimeout(refresh, 400); }
      else renderStatus(await call('showBubble'));
      say('msg-setup', '');
    } catch (e) { say('msg-setup', errText(e)); }
  };
  $('b-mic').onclick = async () => {
    try { const s = await call('requestMic'); renderStatus(s); if (!s.mic) call('openAppSettings').catch(() => {}); } catch (e) { say('msg-setup', errText(e)); }
  };
  $('b-ovl').onclick = () => call('openOverlaySettings').catch((e) => say('msg-setup', errText(e)));
  $('b-acc').onclick = () => call('openAccessibilitySettings').catch((e) => say('msg-setup', errText(e)));

  // Settings
  ['engine', 'mute', 'keepAwake', 'cap', 'autoPeriod', 'model', 'lang', 'context'].forEach((id) => $(id).addEventListener('change', () => saveSettings()));
  $('apiKey').addEventListener('change', () => {
    const v = $('apiKey').value.trim();
    if (!v) return;
    saveSettings({ apiKey: v });
    $('apiKey').value = '';
  });
  $('b-raw-copy').onclick = async () => {
    try { await call('copyText', { text: (await call('transcript')).text }); say('msg-set', 'Copied.'); } catch (e) { say('msg-set', errText(e)); }
  };
  $('b-raw-share').onclick = async () => {
    try { await call('shareText', { text: (await call('transcript')).text, subject: 'Aside Transcribe backup' }); } catch (e) { say('msg-set', errText(e)); }
  };
  let rawArmed = 0;
  $('b-raw-clear').onclick = async () => {
    if (Date.now() - rawArmed > 4000) { rawArmed = Date.now(); $('b-raw-clear').textContent = 'Tap again to clear'; return; }
    $('b-raw-clear').textContent = 'Clear…';
    try { renderStatus(await call('clearTranscript')); say('msg-set', 'Backup cleared. Library recordings are untouched.'); } catch (e) { say('msg-set', errText(e)); }
  };

  Cap.addListener('App', 'resume', async () => { refresh(); await loadData(); render(); });
  Cap.addListener('App', 'backButton', () => back());

  async function start() {
    await refresh();
    await loadData();
    const h = location.hash;
    const m = h.match(/^#rec=([a-z0-9]+)/);
    if (m) { show('library'); openRec(m[1]); return; }
    const tab = h.replace('#', '');
    if (TABS.includes(tab)) show(tab);
    else show(status && status.mic && status.overlay && status.recognizer ? 'library' : 'setup');
  }
  window.addEventListener('hashchange', () => { if (/^#rec=/.test(location.hash) && view !== 'rec') start(); });
  start();
})();
