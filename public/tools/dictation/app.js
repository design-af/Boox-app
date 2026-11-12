// Dictation app page: floating button setup, settings, and the recordings Library (view, edit,
// key points, copy/share, put in Prep, delete). Native side: DictationPlugin.
(function () {
  'use strict';
  const K = window.KBCore;
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.nativePromise);
  const call = (method, args = {}) => Cap.nativePromise('Dictation', method, args);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const errText = (e) => (e && e.message) || String(e);

  let status = null;
  let settingsLoaded = false;
  let current = null; // recording open in detail view

  const opts = () => ({ cap: !status || status.settings.cap !== false, autoPeriod: !status || status.settings.autoPeriod !== false });

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
      : 'None found. Install the Google app or “Speech Recognition & Synthesis from Google” from the Play Store.';
    mark('s-ovl', s.overlay, 3);
    $('b-ovl').textContent = s.overlay ? 'Allowed' : 'Allow';
    $('b-ovl').disabled = !!s.overlay;
    mark('s-acc', s.accessibility, 4);
    mark('s-key', s.settings.hasKey, 5);
    $('h-key').textContent = s.settings.hasKey ? 'A key is saved on this tablet. Paste a new one to replace it.' : 'Stored only on this tablet. From console.anthropic.com.';
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
    if (!native) return;
    try { render(await call('status')); } catch (e) { $('msg-set').textContent = 'Status failed: ' + errText(e); }
  }

  async function saveSettings(extra) {
    try {
      render(await call('setSettings', Object.assign({
        engine: $('engine').value,
        mute: $('mute').checked,
        cap: $('cap').checked,
        autoPeriod: $('autoPeriod').checked,
        lang: $('lang').value.trim(),
        model: $('model').value,
        context: $('context').value,
      }, extra || {})));
      $('msg-set').textContent = 'Saved.';
    } catch (e) { $('msg-set').textContent = 'Save failed: ' + errText(e); }
  }

  // ---------------------------------------------------------------- library

  async function loadLibrary() {
    let items = [];
    let st = {};
    try { items = JSON.parse((await call('list')).json || '[]'); } catch (e) { }
    try { st = JSON.parse((await call('state')).json || '{}'); } catch (e) { }
    items.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    $('lib-empty').hidden = items.length > 0;
    $('lib').innerHTML = items.map((m) => {
      const d = new Date(m.created || m.updated);
      const when = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const bits = [when, m.words + ' words'];
      if (m.hasSummary) bits.push('key points');
      if (m.flags) bits.push(m.flags + ' to review');
      if (m.pushed) bits.push('pushed ✓');
      const where = m.id === st.liveId ? 'LIVE · ' : m.id === st.prepId ? 'IN PREP · ' : '';
      return '<li data-id="' + esc(m.id) + '"><span class="t">' + esc(m.title || K.defaultTitle({ created: m.created })) + '</span><span class="m">' + where + bits.join(' · ') + '</span></li>';
    }).join('');
  }

  async function openDetail(id) {
    try {
      current = JSON.parse((await call('load', { id })).json);
    } catch (e) { alertMsg('msg-set', 'Could not open recording: ' + errText(e)); return; }
    $('main-view').hidden = true;
    $('detail-view').hidden = false;
    $('heading').textContent = 'Recording';
    $('back').textContent = '← Dictation';
    $('d-title').value = current.title || '';
    $('d-title').placeholder = K.defaultTitle(current);
    $('d-text').value = K.plain(current, opts());
    $('d-text').dataset.orig = $('d-text').value;
    $('d-points').value = current.summary || '';
    $('d-meta').textContent = K.wordCount(current) + ' words' + (current.flags && current.flags.length ? ' · ' + current.flags.length + ' flagged words to review in the panel' : '') + (current.pushed ? ' · pushed ' + new Date(current.pushed).toLocaleString() : '');
    $('msg-d').textContent = '';
    $('d-delete').textContent = 'Delete…';
    document.querySelector('.middle').scrollTop = 0;
  }

  function closeDetail() {
    current = null;
    $('detail-view').hidden = true;
    $('main-view').hidden = false;
    $('heading').textContent = 'Dictation';
    $('back').textContent = '← Tools';
    if (location.hash) history.replaceState(null, '', location.pathname);
    loadLibrary();
  }

  function alertMsg(id, t) { $(id).textContent = t; }

  function collectDetail() {
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

  async function saveDetail(toPrep) {
    const rec = collectDetail();
    if (!rec) return;
    try {
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      if (toPrep) {
        const st = JSON.parse((await call('state')).json || '{}');
        if (st.liveId === rec.id) st.liveId = null;
        st.prepId = rec.id;
        await call('setState', { json: JSON.stringify(st) });
      }
      alertMsg('msg-d', toPrep ? 'Saved and put in Prep. Open the floating panel to Push it.' : 'Saved.');
    } catch (e) { alertMsg('msg-d', 'Save failed: ' + errText(e)); }
  }

  // ---------------------------------------------------------------- wiring

  if (!native) {
    $('notnative').hidden = false;
    return;
  }

  $('back').addEventListener('click', (e) => {
    if (!$('detail-view').hidden) { e.preventDefault(); closeDetail(); }
  });

  $('b-bubble').addEventListener('click', async () => {
    try {
      if (status && status.bubble) { await call('hideBubble'); setTimeout(refresh, 400); }
      else { render(await call('showBubble')); }
    } catch (e) { alertMsg('msg-set', errText(e)); $('msg-set').scrollIntoView({ block: 'center' }); }
  });
  $('b-mic').addEventListener('click', async () => {
    try {
      const s = await call('requestMic');
      render(s);
      if (!s.mic) call('openAppSettings').catch(() => {});
    } catch (e) { alertMsg('msg-set', errText(e)); }
  });
  $('b-ovl').addEventListener('click', () => call('openOverlaySettings').catch((e) => alertMsg('msg-set', errText(e))));
  $('b-acc').addEventListener('click', () => call('openAccessibilitySettings').catch((e) => alertMsg('msg-set', errText(e))));

  ['engine', 'mute', 'cap', 'autoPeriod', 'model'].forEach((id) => $(id).addEventListener('change', () => saveSettings()));
  $('lang').addEventListener('change', () => saveSettings());
  $('context').addEventListener('change', () => saveSettings());
  $('apiKey').addEventListener('change', () => {
    const v = $('apiKey').value.trim();
    if (!v) return;
    saveSettings({ apiKey: v });
    $('apiKey').value = '';
  });

  $('lib').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (li) openDetail(li.dataset.id);
  });

  $('d-copy').addEventListener('click', async () => {
    try { await call('copyText', { text: $('d-text').value }); alertMsg('msg-d', 'Transcript copied.'); } catch (e) { alertMsg('msg-d', errText(e)); }
  });
  $('d-share').addEventListener('click', () => {
    const t = $('d-text').value + ($('d-points').value.trim() ? '\n\nKey points\n' + $('d-points').value.trim() : '');
    call('shareText', { text: t, subject: $('d-title').value || $('d-title').placeholder }).catch((e) => alertMsg('msg-d', errText(e)));
  });
  $('d-pcopy').addEventListener('click', async () => {
    if (!$('d-points').value.trim()) { alertMsg('msg-d', 'No key points yet.'); return; }
    try { await call('copyText', { text: $('d-points').value.trim() }); alertMsg('msg-d', 'Key points copied.'); } catch (e) { alertMsg('msg-d', errText(e)); }
  });
  $('d-gen').addEventListener('click', async () => {
    const rec = collectDetail();
    if (!rec) return;
    if (!status || !status.settings.hasKey) { alertMsg('msg-d', 'Add a Claude API key in Settings first.'); return; }
    $('d-gen').disabled = true;
    alertMsg('msg-d', 'Writing key points…');
    try {
      const res = (await call('claude', { body: JSON.stringify(K.summaryRequest(rec, opts(), $('context').value)) })).json;
      K.applySummary(rec, res);
      $('d-points').value = rec.summary;
      if (!$('d-title').value) $('d-title').value = rec.title || '';
      await call('save', { id: rec.id, json: JSON.stringify(rec) });
      alertMsg('msg-d', 'Key points written and saved.');
    } catch (e) { alertMsg('msg-d', 'Key points failed: ' + errText(e)); }
    $('d-gen').disabled = false;
  });
  $('d-save').addEventListener('click', () => saveDetail(false));
  $('d-prep').addEventListener('click', () => saveDetail(true));
  let delArmed = 0;
  $('d-delete').addEventListener('click', async () => {
    if (Date.now() - delArmed > 4000) { delArmed = Date.now(); $('d-delete').textContent = 'Tap again to delete'; return; }
    try {
      const st = JSON.parse((await call('state')).json || '{}');
      if (st.liveId === current.id) st.liveId = null;
      if (st.prepId === current.id) st.prepId = null;
      await call('setState', { json: JSON.stringify(st) });
      await call('remove', { id: current.id });
      closeDetail();
    } catch (e) { alertMsg('msg-d', errText(e)); }
  });

  $('b-raw-copy').addEventListener('click', async () => {
    try { const t = (await call('transcript')).text; await call('copyText', { text: t }); alertMsg('msg-raw', 'Copied.'); } catch (e) { alertMsg('msg-raw', errText(e)); }
  });
  $('b-raw-share').addEventListener('click', async () => {
    try { const t = (await call('transcript')).text; await call('shareText', { text: t, subject: 'Dictation backup' }); } catch (e) { alertMsg('msg-raw', errText(e)); }
  });
  let rawArmed = 0;
  $('b-raw-clear').addEventListener('click', async () => {
    if (Date.now() - rawArmed > 4000) { rawArmed = Date.now(); $('b-raw-clear').textContent = 'Tap again to clear'; return; }
    $('b-raw-clear').textContent = 'Clear…';
    try { render(await call('clearTranscript')); alertMsg('msg-raw', 'Backup cleared. Library recordings are untouched.'); } catch (e) { alertMsg('msg-raw', errText(e)); }
  });

  Cap.addListener('App', 'resume', () => { refresh(); if ($('detail-view').hidden) loadLibrary(); });
  Cap.addListener('App', 'backButton', () => {
    if (!$('detail-view').hidden) closeDetail();
    else location.href = '../../index.html';
  });

  function route() {
    const m = location.hash.match(/^#rec=([a-z0-9]+)/);
    if (m) openDetail(m[1]);
    else if (location.hash === '#library') setTimeout(() => $('library').scrollIntoView(), 300);
  }
  window.addEventListener('hashchange', route);

  refresh();
  loadLibrary();
  route();
})();
