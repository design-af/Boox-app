// Dictation tool: setup checklist, settings and backup transcript for the AFS Dictation keyboard
// (native DictationIME + DictationPlugin). Plain script; talks to native via Capacitor.nativePromise.
(function () {
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.nativePromise);
  const call = (method, args = {}) => Cap.nativePromise('Dictation', method, args);
  const $ = (id) => document.getElementById(id);
  const msg = (t) => { $('msg').textContent = t; };

  function mark(stepId, done) {
    $(stepId).classList.toggle('done', !!done);
    $(stepId).querySelector('.mark').textContent = done ? '✓' : $(stepId).dataset.n;
  }
  ['s-mic', 's-eng', 's-on', 's-sel'].forEach((id, i) => { $(id).dataset.n = String(i + 1); });

  let settingsLoaded = false;

  function render(s) {
    mark('s-mic', s.mic);
    $('b-mic').textContent = s.mic ? 'Allowed' : 'Allow';
    $('b-mic').disabled = !!s.mic;

    mark('s-eng', s.recognizer);
    $('h-eng').textContent = s.recognizer
      ? (s.onDevice ? 'Found, including on-device (works offline).' : 'Found (online; needs Wi-Fi or hotspot).')
      : 'None found. Install the Google app or “Speech Recognition & Synthesis from Google” from the Play Store, then come back.';

    mark('s-on', s.enabled);
    mark('s-sel', s.selected);

    if (!settingsLoaded && s.settings) {
      settingsLoaded = true;
      $('engine').value = s.settings.engine || 'auto';
      $('live').checked = s.settings.live !== false;
      $('mute').checked = s.settings.mute !== false;
      $('cap').checked = s.settings.cap !== false;
      $('lang').value = s.settings.lang || '';
    }
  }

  async function refresh() {
    if (!native) return;
    try { render(await call('status')); } catch (e) { msg('Status failed: ' + (e.message || e)); }
  }

  async function loadTranscript() {
    if (!native) return;
    try {
      const r = await call('transcript');
      const t = $('transcript');
      t.value = r.text || '';
      t.scrollTop = t.scrollHeight;
    } catch (e) { msg('Could not read transcript: ' + (e.message || e)); }
  }

  async function save() {
    if (!native) return;
    try {
      await call('setSettings', {
        engine: $('engine').value,
        live: $('live').checked,
        mute: $('mute').checked,
        cap: $('cap').checked,
        lang: $('lang').value.trim(),
      });
      msg('Saved. Applies next time you tap Start.');
    } catch (e) { msg('Save failed: ' + (e.message || e)); }
  }

  if (!native) {
    $('notnative').hidden = false;
    return;
  }

  $('b-mic').addEventListener('click', async () => {
    try {
      const s = await call('requestMic');
      render(s);
      if (!s.mic) {
        msg('Microphone was declined. Opening app settings: Permissions → Microphone → Allow.');
        call('openAppSettings').catch(() => {});
      }
    } catch (e) { msg('Mic request failed: ' + (e.message || e)); }
  });
  $('b-on').addEventListener('click', () => call('openKeyboardSettings').catch((e) => msg(e.message || String(e))));
  $('b-sel').addEventListener('click', () => {
    $('tryit').focus();
    call('showPicker').catch((e) => msg(e.message || String(e)));
  });

  ['engine', 'live', 'mute', 'cap'].forEach((id) => $(id).addEventListener('change', save));
  $('lang').addEventListener('change', save);

  $('b-reload').addEventListener('click', loadTranscript);
  $('b-copy').addEventListener('click', async () => {
    try { await call('copyTranscript'); msg('Copied. Paste it into your notes.'); } catch (e) { msg(e.message || String(e)); }
  });
  $('b-share').addEventListener('click', () => call('shareTranscript').catch((e) => msg(e.message || String(e))));

  let clearArmed = 0;
  $('b-clear').addEventListener('click', async () => {
    const now = Date.now();
    if (now - clearArmed > 4000) {
      clearArmed = now;
      $('b-clear').textContent = 'Tap again to clear';
      setTimeout(() => { if (Date.now() - clearArmed >= 4000) $('b-clear').textContent = 'Clear…'; }, 4100);
      return;
    }
    clearArmed = 0;
    $('b-clear').textContent = 'Clear…';
    try { render(await call('clearTranscript')); await loadTranscript(); msg('Backup cleared.'); } catch (e) { msg(e.message || String(e)); }
  });

  // Settings screens and the keyboard picker take the user away; re-check when they return.
  Cap.addListener('App', 'resume', () => { refresh(); loadTranscript(); });
  Cap.addListener('App', 'backButton', () => { location.href = '../../index.html'; });
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refresh(); loadTranscript(); } });
  $('tryit').addEventListener('focus', () => setTimeout(refresh, 800));

  refresh();
  loadTranscript();
})();
