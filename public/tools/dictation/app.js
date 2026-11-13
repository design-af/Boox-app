// Aside Transcribe app page. Tabs: Library (recordings, grouped; key points per group),
// Setup (floating button + permissions + how it flows), Settings. Detail views for a group and
// a recording. Native side: DictationPlugin. Shared logic: kbcore.js.
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
  let items = [];               // recording metadata from native list
  let groups = { groups: [] };  // groups.json
  let st = {};                  // { liveId, prepId }
  let view = 'library';         // library | setup | settings | group | rec
  let selecting = false;
  const picked = new Set();
  let currentGroup = null;      // group open in the group view
  let current = null;           // recording open in the recording view
  let recFrom = 'library';      // where Back from a recording goes
  let syImages = [];            // [{ media_type, data }] for New symposium
  let syData = null;            // what Claude read: { event, date, sessions }

  const opts = () => ({ cap: !status || status.settings.cap !== false, autoPeriod: !status || status.settings.autoPeriod !== false });
  const context = () => (status && status.settings.context) || '';
  const hasKey = () => !!(status && status.settings.hasKey);

  function when(t, withYear) {
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined }) +
      ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const dayKey = (t) => new Date(t).toDateString();
  const dayLabel = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  // ---------------------------------------------------------------- views

  const TABS = ['library', 'setup', 'settings'];
  function show(v) {
    view = v;
    $('tabs').hidden = !TABS.includes(v);
    TABS.forEach((t) => {
      $('v-' + t).hidden = v !== t;
      $('tab-' + t).setAttribute('aria-selected', String(v === t));
    });
    $('v-group').hidden = v !== 'group';
    $('v-symp').hidden = v !== 'symp';
    $('v-rec').hidden = v !== 'rec';
    if (TABS.includes(v)) {
      $('heading').textContent = 'Aside Transcribe';
      $('back').textContent = '← Tools';
    } else if (v === 'group') {
      $('heading').textContent = currentGroup && currentGroup.event ? 'Session' : 'Group';
      $('back').textContent = '← Library';
    } else if (v === 'symp') {
      $('heading').textContent = 'New symposium';
      $('back').textContent = '← Library';
    } else {
      $('heading').textContent = 'Recording';
      $('back').textContent = recFrom === 'group' ? '← Group' : '← Library';
    }
    $('middle').scrollTop = 0;
    const hash = v === 'group' && currentGroup ? '#group=' + currentGroup.id : v === 'rec' && current ? '#rec=' + current.id : '#' + v;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function goBack() {
    if (view === 'rec') {
      current = null;
      if (recFrom === 'group' && currentGroup) { openGroup(currentGroup.id); return; }
      show('library'); loadLibrary(); return;
    }
    if (view === 'group' || view === 'symp') { currentGroup = null; show('library'); loadLibrary(); return; }
    location.href = '../../index.html';
  }

  // ---------------------------------------------------------------- setup + settings

  function mark(stepId, done, n) {
    $(stepId).classList.toggle('done', !!done);
    $(stepId).querySelector('.mark').textContent = done ? '✓' : n;
  }

  function render(s) {
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
      $('cap').checked = t.cap !== false;
      $('autoPeriod').checked = t.autoPeriod !== false;
      $('lang').value = t.lang || '';
      $('model').value = t.model || 'claude-sonnet-5-5';
      $('context').value = t.context || '';
    }
  }

  async function refresh() {
    try { render(await call('status')); } catch (e) { say('msg-set', 'Status failed: ' + errText(e)); }
  }

  async function saveSettings(extra) {
    try {
      render(await call('setSettings', Object.assign({
        engine: $('engine').value, mute: $('mute').checked, cap: $('cap').checked, autoPeriod: $('autoPeriod').checked,
        lang: $('lang').value.trim(), model: $('model').value, context: $('context').value,
      }, extra || {})));
      say('msg-set', 'Saved.');
    } catch (e) { say('msg-set', 'Save failed: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- data

  async function loadData() {
    try { items = JSON.parse((await call('list')).json || '[]'); } catch (e) { items = []; }
    try { groups = JSON.parse((await call('groups')).json || '{"groups":[]}'); } catch (e) { groups = { groups: [] }; }
    try { st = JSON.parse((await call('state')).json || '{}'); } catch (e) { st = {}; }
    if (!Array.isArray(groups.groups)) groups.groups = [];
    // Drop group entries for recordings that no longer exist.
    const ids = new Set(items.map((m) => m.id));
    groups.groups.forEach((g) => { g.ids = (g.ids || []).filter((id) => ids.has(id)); });
  }
  const saveGroups = () => call('saveGroups', { json: JSON.stringify(groups) });
  const meta = (id) => items.find((m) => m.id === id);
  async function loadRec(id) { return JSON.parse((await call('load', { id })).json); }

  function groupOptions(selected) {
    return '<option value="">Not grouped</option>' +
      groups.groups.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === selected ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') +
      '<option value="__new">New group…</option>';
  }

  // ---------------------------------------------------------------- library

  function rowHtml(m, o) {
    const bits = [when(m.created || m.updated), m.words + ' words'];
    if (m.hasSummary) bits.push('key points');
    if (m.flags) bits.push(m.flags + ' to review');
    if (m.pushed) bits.push('pushed ✓');
    const where = m.id === st.liveId ? 'LIVE · ' : m.id === st.prepId ? 'IN PREP · ' : '';
    const sel = selecting && !(o && o.noSelect);
    const isPicked = picked.has(m.id);
    return '<li class="' + (sel && isPicked ? 'picked' : '') + '"><button class="rowbtn" data-id="' + esc(m.id) + '"' +
      (sel ? ' aria-pressed="' + isPicked + '"' : '') + '>' +
      (sel ? '<span class="box" aria-hidden="true">' + (isPicked ? '✓' : '') + '</span>' : '') +
      '<span class="meta"><span class="t">' + esc(m.title || K.defaultTitle({ created: m.created })) + '</span><span class="m">' + where + bits.join(' · ') + '</span></span></button>' +
      (o && o.remove ? '<button class="side" data-remove="' + esc(m.id) + '">Remove</button>' : '') + '</li>';
  }

  function renderLibrary() {
    const out = [];
    const byGroup = new Set();
    // Events (from New symposium) first, newest first, their sessions in programme order; then other groups.
    const events = new Map();
    groups.groups.filter((g) => g.eventId).forEach((g) => {
      if (!events.has(g.eventId)) events.set(g.eventId, { name: g.event, created: g.created, list: [] });
      events.get(g.eventId).list.push(g);
    });
    const evs = Array.from(events.values()).sort((a, b) => (b.created || 0) - (a.created || 0));
    const plain = groups.groups.filter((g) => !g.eventId).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const gs = [];
    const heads = new Map();
    evs.forEach((e) => { e.list.sort((a, b) => (a.order || 0) - (b.order || 0)); e.list.forEach((g, i) => { if (i === 0) heads.set(g.id, e.name); gs.push(g); }); });
    plain.forEach((g) => gs.push(g));
    let plainHead = false;
    for (const g of gs) {
      if (heads.has(g.id)) out.push('<div class="event">' + esc(heads.get(g.id)) + '</div>');
      else if (!g.eventId && evs.length && !plainHead) { plainHead = true; out.push('<div class="event">Groups</div>'); }
      const ms = g.ids.map(meta).filter(Boolean).sort((a, b) => (a.created || 0) - (b.created || 0));
      ms.forEach((m) => byGroup.add(m.id));
      const words = ms.reduce((n, m) => n + (m.words || 0), 0);
      const info = [ms.length + (ms.length === 1 ? ' recording' : ' recordings'), words + ' words'];
      if (g.summary) info.push('key points ✓');
      if (g.speakers && g.speakers.length) info.unshift(g.speakers.join(', '));
      out.push('<section class="grp"><div class="grp-h"><button class="open" data-group="' + esc(g.id) + '"><span class="t">' + esc(g.name) +
        '</span><span class="m">' + info.join(' · ') + '</span></button><button class="kp" data-kp="' + esc(g.id) + '">Key points</button></div>' +
        (ms.length ? '<ul class="lib">' + ms.map((m) => rowHtml(m)).join('') + '</ul>' : '<p class="empty" style="padding:12px">Empty. Select recordings, then Add to group.</p>') +
        '</section>');
    }
    // Everything not in a group, by day.
    const loose = items.filter((m) => !byGroup.has(m.id)).sort((a, b) => (b.created || 0) - (a.created || 0));
    let day = null;
    let buf = [];
    const flush = () => { if (buf.length) { out.push('<ul class="lib">' + buf.join('') + '</ul>'); buf = []; } };
    for (const m of loose) {
      const k = dayKey(m.created || m.updated);
      if (k !== day) { flush(); day = k; out.push('<div class="day">' + esc(dayLabel(m.created || m.updated)) + (groups.groups.length ? ' · not grouped' : '') + '</div>'); }
      buf.push(rowHtml(m));
    }
    flush();
    if (!items.length) out.push('<p class="empty">No recordings yet. Show the floating button (Setup), tap it, and tap Start.</p>');
    $('lib').innerHTML = out.join('');
    $('selcount').textContent = picked.size + ' selected';
    ['b-addto', 'b-ungroup', 'b-delsel'].forEach((id) => { $(id).disabled = picked.size === 0; });
  }

  async function loadLibrary() {
    await loadData();
    picked.forEach((id) => { if (!meta(id)) picked.delete(id); });
    renderLibrary();
  }

  function setSelecting(on) {
    selecting = on;
    if (!on) picked.clear();
    $('libbar').hidden = on;
    $('selbar').hidden = !on;
    $('chooser').hidden = true;
    renderLibrary();
  }

  function openChooser(forNew) {
    const sel = $('ch-group');
    sel.innerHTML = groups.groups.map((g) => '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>').join('') +
      '<option value="__new">New group…</option>';
    sel.value = forNew || !groups.groups.length ? '__new' : groups.groups[0].id;
    $('ch-name').value = '';
    $('ch-name').hidden = sel.value !== '__new';
    $('ch-title').textContent = forNew ? 'New group' : 'Add ' + picked.size + ' to group';
    $('ch-ok').textContent = forNew && !picked.size ? 'Create' : 'Add';
    $('chooser').hidden = false;
    if (sel.value === '__new') $('ch-name').focus();
  }

  async function chooserOk() {
    let gid = $('ch-group').value;
    if (gid === '__new') {
      const g = K.newGroup($('ch-name').value || 'Group ' + (groups.groups.length + 1));
      groups.groups.push(g);
      gid = g.id;
    }
    if (picked.size) K.assignToGroup(groups, gid, Array.from(picked));
    try { await saveGroups(); } catch (e) { say('msg-lib', 'Could not save: ' + errText(e)); return; }
    $('chooser').hidden = true;
    if (selecting) setSelecting(false); else renderLibrary();
    say('msg-lib', 'Saved.');
  }

  let delArmedSel = 0;
  async function deleteSelected() {
    if (Date.now() - delArmedSel > 4000) { delArmedSel = Date.now(); $('b-delsel').textContent = 'Tap again to delete'; return; }
    $('b-delsel').textContent = 'Delete…';
    const ids = Array.from(picked);
    for (const id of ids) {
      if (st.liveId === id) st.liveId = null;
      if (st.prepId === id) st.prepId = null;
      try { await call('remove', { id }); } catch (e) { }
    }
    K.removeFromGroups(groups, ids);
    await saveGroups();
    await call('setState', { json: JSON.stringify(st) });
    say('msg-lib', ids.length + ' deleted.');
    setSelecting(false);
    loadLibrary();
  }

  // ---------------------------------------------------------------- group view

  function openGroup(id, generate) {
    currentGroup = groups.groups.find((g) => g.id === id);
    if (!currentGroup) { show('library'); return; }
    $('g-name').value = currentGroup.name;
    $('g-points').value = currentGroup.summary || '';
    $('g-delete').textContent = 'Delete group…';
    say('msg-g', '');
    renderGroupList();
    show('group');
    if (generate && !currentGroup.summary) groupKeyPoints();
  }

  function renderGroupList() {
    const ms = currentGroup.ids.map(meta).filter(Boolean).sort((a, b) => (a.created || 0) - (b.created || 0));
    const words = ms.reduce((n, m) => n + (m.words || 0), 0);
    $('g-meta').textContent = (currentGroup.event ? currentGroup.event + ' · ' : '') +
      (currentGroup.speakers && currentGroup.speakers.length ? currentGroup.speakers.join(', ') + ' · ' : '') +
      ms.length + (ms.length === 1 ? ' recording' : ' recordings') + ' · ' + words + ' words' +
      (currentGroup.title && currentGroup.title !== currentGroup.name ? ' · suggested title: ' + currentGroup.title : '');
    $('g-list').innerHTML = ms.length ? ms.map((m) => rowHtml(m, { noSelect: true, remove: true })).join('') : '<li><p class="empty" style="padding:12px">No recordings. In the Library, Select some and Add to group.</p></li>';
    $('g-gen').disabled = !ms.length;
  }

  async function groupRecs() {
    const out = [];
    for (const id of currentGroup.ids) { try { out.push(await loadRec(id)); } catch (e) { } }
    return out;
  }

  async function groupKeyPoints() {
    const g = currentGroup;
    if (!hasKey()) { say('msg-g', 'Key points need a Claude API key (Settings tab).'); return; }
    $('g-gen').disabled = true;
    say('msg-g', 'Writing key points for ' + g.ids.length + ' recordings…');
    try {
      const recs = await groupRecs();
      if (!recs.length) throw new Error('no recordings in this group');
      const res = (await call('claude', { body: JSON.stringify(K.groupSummaryRequest(g.name, recs, opts(), context())) })).json;
      g.title = '';
      K.applySummary(g, res);
      g.updated = Date.now();
      await saveGroups();
      if (currentGroup === g) { $('g-points').value = g.summary; renderGroupList(); }
      say('msg-g', 'Key points written and saved.');
    } catch (e) { say('msg-g', 'Key points failed: ' + errText(e)); }
    $('g-gen').disabled = false;
  }

  async function groupToPrep() {
    const g = currentGroup;
    const text = $('g-points').value.trim();
    if (!text) { say('msg-g', 'No key points yet.'); return; }
    g.summary = text;
    const rec = K.newRecording();
    rec.title = 'Key points — ' + g.name;
    K.setEditedText(rec, K.groupKeyPointsText(g));
    rec.summary = text;
    try {
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      K.assignToGroup(groups, g.id, [rec.id]);
      await saveGroups();
      st = JSON.parse((await call('state')).json || '{}');
      st.prepId = rec.id;
      await call('setState', { json: JSON.stringify(st) });
      await loadData();
      currentGroup = groups.groups.find((x) => x.id === g.id);
      renderGroupList();
      say('msg-g', 'In Prep. Open the floating panel, tap into your notes and Push.');
    } catch (e) { say('msg-g', 'Failed: ' + errText(e)); }
  }

  async function groupAllText() {
    const recs = (await groupRecs()).sort((a, b) => (a.created || 0) - (b.created || 0));
    const parts = [currentGroup.name];
    if ($('g-points').value.trim()) parts.push('Key points\n' + $('g-points').value.trim());
    for (const r of recs) parts.push(K.titleOf(r) + '\n' + K.plain(r, opts()));
    return parts.join('\n\n');
  }

  // ---------------------------------------------------------------- new symposium

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
    if (!hasKey()) { say('msg-sy', 'Reading the programme needs a Claude API key (Settings tab).'); return; }
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
      '<input class="who" type="text" aria-label="Speakers" placeholder="Speakers, separated by commas" data-f="speakers" value="' + esc(x.speakers.join(', ')) + '">' +
      '<button data-rm="' + i + '">Remove</button></div>').join('');
  }

  function collectSymp() {
    if (!syData) syData = { event: '', date: '', sessions: [] };
    syData.event = $('sy-event').value.trim();
    syData.sessions = Array.from($('sy-list').querySelectorAll('.sess')).map((el) => ({
      time: el.querySelector('[data-f="time"]').value.trim(),
      title: el.querySelector('[data-f="title"]').value.trim(),
      speakers: el.querySelector('[data-f="speakers"]').value.split(',').map((t) => t.trim()).filter(Boolean),
      room: '',
    }));
  }

  async function createSymposium() {
    collectSymp();
    const list = syData.sessions.filter((x) => x.title || x.speakers.length);
    if (!list.length) { say('msg-sy', 'Add at least one session.'); return; }
    await loadData();
    const made = K.makeSessionGroups(groups, { event: syData.event || 'Symposium', date: '', sessions: list });
    try {
      await saveGroups();
      say('msg-lib', made.length + ' sessions created for ' + (syData.event || 'Symposium') + '. Pick the session in the floating panel while you record.');
      resetSymp();
      show('library');
      renderLibrary();
    } catch (e) { say('msg-sy', 'Could not save: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- recording view

  async function openRec(id, from) {
    try { current = await loadRec(id); } catch (e) { say('msg-lib', 'Could not open recording: ' + errText(e)); return; }
    recFrom = from || 'library';
    $('d-title').value = current.title || '';
    $('d-title').placeholder = K.defaultTitle(current);
    $('d-text').value = K.plain(current, opts());
    $('d-text').dataset.orig = $('d-text').value;
    $('d-points').value = current.summary || '';
    const g = K.groupOf(groups, current.id);
    $('d-group').innerHTML = groupOptions(g ? g.id : '');
    $('d-newgroup').hidden = true;
    $('d-newgroup').value = '';
    $('d-meta').textContent = when(current.created, true) + ' · ' + K.wordCount(current) + ' words' +
      (current.flags && current.flags.length ? ' · ' + current.flags.length + ' flagged words to review in the panel' : '') +
      (current.pushed ? ' · pushed ' + when(current.pushed) : '');
    say('msg-d', '');
    $('d-delete').textContent = 'Delete…';
    show('rec');
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
      if (gid === '__new') {
        const g = K.newGroup($('d-newgroup').value || 'Group ' + (groups.groups.length + 1));
        groups.groups.push(g);
        gid = g.id;
      }
      if (gid) K.assignToGroup(groups, gid, [rec.id]); else K.removeFromGroups(groups, [rec.id]);
      await saveGroups();
      if (toPrep) {
        st = JSON.parse((await call('state')).json || '{}');
        if (st.liveId === rec.id) st.liveId = null;
        st.prepId = rec.id;
        await call('setState', { json: JSON.stringify(st) });
      }
      await loadData();
      $('d-group').innerHTML = groupOptions(gid || '');
      $('d-newgroup').hidden = true;
      say('msg-d', toPrep ? 'Saved and put in Prep. Open the floating panel to Push it.' : 'Saved.');
    } catch (e) { say('msg-d', 'Save failed: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- wiring

  if (!native) { $('notnative').hidden = false; return; }

  $('back').addEventListener('click', (e) => { e.preventDefault(); goBack(); });
  TABS.forEach((t) => $('tab-' + t).addEventListener('click', () => { show(t); if (t === 'library') loadLibrary(); else refresh(); }));

  // New symposium
  $('b-newsymp').onclick = () => { resetSymp(); show('symp'); };
  $('sy-pick').addEventListener('change', async () => {
    const files = Array.from($('sy-pick').files || []);
    for (const f of files) { try { syImages.push(await shrinkImage(f)); } catch (e) { say('msg-sy', 'Could not read ' + f.name); } }
    $('sy-pick').value = '';
    $('sy-imgs').textContent = syImages.length ? syImages.length + (syImages.length === 1 ? ' image' : ' images') + ' added.' : 'No images yet.';
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

  // Library
  $('b-newgroup').onclick = () => openChooser(true);
  $('b-select').onclick = () => setSelecting(true);
  $('b-done').onclick = () => setSelecting(false);
  $('b-addto').onclick = () => openChooser(false);
  $('b-ungroup').onclick = async () => { K.removeFromGroups(groups, Array.from(picked)); await saveGroups(); setSelecting(false); say('msg-lib', 'Ungrouped.'); };
  $('b-delsel').onclick = deleteSelected;
  $('ch-group').onchange = () => { $('ch-name').hidden = $('ch-group').value !== '__new'; };
  $('ch-cancel').onclick = () => { $('chooser').hidden = true; };
  $('ch-ok').onclick = chooserOk;
  $('lib').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.group) { openGroup(b.dataset.group); return; }
    if (b.dataset.kp) { openGroup(b.dataset.kp, true); return; }
    if (b.dataset.id) {
      if (selecting) {
        if (picked.has(b.dataset.id)) picked.delete(b.dataset.id); else picked.add(b.dataset.id);
        renderLibrary();
      } else openRec(b.dataset.id, 'library');
    }
  });

  // Group
  $('g-name').addEventListener('change', async () => {
    currentGroup.name = $('g-name').value.trim() || currentGroup.name;
    $('g-name').value = currentGroup.name;
    currentGroup.updated = Date.now();
    await saveGroups();
    say('msg-g', 'Renamed.');
  });
  $('g-points').addEventListener('change', async () => { currentGroup.summary = $('g-points').value.trim(); await saveGroups(); say('msg-g', 'Saved.'); });
  $('g-gen').onclick = groupKeyPoints;
  $('g-pcopy').onclick = async () => {
    if (!$('g-points').value.trim()) { say('msg-g', 'No key points yet.'); return; }
    await call('copyText', { text: K.groupKeyPointsText({ name: currentGroup.name, summary: $('g-points').value }) });
    say('msg-g', 'Key points copied.');
  };
  $('g-prep').onclick = groupToPrep;
  $('g-copyall').onclick = async () => { await call('copyText', { text: await groupAllText() }); say('msg-g', 'Everything copied.'); };
  $('g-share').onclick = async () => { call('shareText', { text: await groupAllText(), subject: currentGroup.name }).catch((e) => say('msg-g', errText(e))); };
  let gDelArmed = 0;
  $('g-delete').onclick = async () => {
    if (Date.now() - gDelArmed > 4000) { gDelArmed = Date.now(); $('g-delete').textContent = 'Tap again to delete group'; return; }
    groups.groups = groups.groups.filter((g) => g !== currentGroup);
    await saveGroups();
    currentGroup = null;
    show('library');
    loadLibrary();
  };
  $('g-list').addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.remove) {
      K.removeFromGroups(groups, [b.dataset.remove]);
      await saveGroups();
      renderGroupList();
    } else if (b.dataset.id) openRec(b.dataset.id, 'group');
  });

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
  let delArmed = 0;
  $('d-delete').onclick = async () => {
    if (Date.now() - delArmed > 4000) { delArmed = Date.now(); $('d-delete').textContent = 'Tap again to delete'; return; }
    try {
      st = JSON.parse((await call('state')).json || '{}');
      if (st.liveId === current.id) st.liveId = null;
      if (st.prepId === current.id) st.prepId = null;
      await call('setState', { json: JSON.stringify(st) });
      await call('remove', { id: current.id });
      K.removeFromGroups(groups, [current.id]);
      await saveGroups();
      current = null;
      await loadData();
      if (recFrom === 'group' && currentGroup) openGroup(currentGroup.id); else { show('library'); renderLibrary(); }
    } catch (e) { say('msg-d', errText(e)); }
  };

  // Setup
  $('b-bubble').onclick = async () => {
    try {
      if (status && status.bubble) { await call('hideBubble'); setTimeout(refresh, 400); }
      else render(await call('showBubble'));
      say('msg-setup', '');
    } catch (e) { say('msg-setup', errText(e)); }
  };
  $('b-mic').onclick = async () => {
    try { const s = await call('requestMic'); render(s); if (!s.mic) call('openAppSettings').catch(() => {}); } catch (e) { say('msg-setup', errText(e)); }
  };
  $('b-ovl').onclick = () => call('openOverlaySettings').catch((e) => say('msg-setup', errText(e)));
  $('b-acc').onclick = () => call('openAccessibilitySettings').catch((e) => say('msg-setup', errText(e)));

  // Settings
  ['engine', 'mute', 'cap', 'autoPeriod', 'model', 'lang', 'context'].forEach((id) => $(id).addEventListener('change', () => saveSettings()));
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
    try { render(await call('clearTranscript')); say('msg-set', 'Backup cleared. Library recordings are untouched.'); } catch (e) { say('msg-set', errText(e)); }
  };

  Cap.addListener('App', 'resume', () => { refresh(); if (view === 'library') loadLibrary(); });
  Cap.addListener('App', 'backButton', () => goBack());

  async function route() {
    await refresh();
    await loadData();
    const h = location.hash;
    let m;
    if ((m = h.match(/^#rec=([a-z0-9]+)/))) { renderLibrary(); openRec(m[1], 'library'); return; }
    if ((m = h.match(/^#group=([a-z0-9]+)/))) { renderLibrary(); openGroup(m[1]); return; }
    const tab = h.replace('#', '');
    if (TABS.includes(tab)) show(tab);
    else show(status && status.mic && status.overlay && status.recognizer ? 'library' : 'setup');
    renderLibrary();
  }
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    if (/^#(rec|group)=/.test(h) || TABS.includes(h.replace('#', ''))) route();
  });
  route();
})();
