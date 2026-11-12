# Dictation (AFS Dictation floating button)

Live transcription of talks over any app, with the user's own keyboard still in use.
Flow: **Live → Prep → Push**, every recording kept in a **Library**.

## Parts
- `DictationService.java` — foreground service (type microphone). Draws a draggable bubble
  (tap = open/close panel, long-press = start/stop recording, drag = move) and a panel window
  (native grip bar + WebView running `public/tools/dictation/panel.html`). Panel is 1/3 of the
  screen's width and height, 2/3 when expanded; drag the grip to move it, tap it to resize
  (prefs `panelX`, `panelY`, `panelBig`). The keyboard is always drawn above overlay windows, so
  while it shows (bounds from DictationAccessibility) the panel and bubble move above it. Both windows are `FLAG_NOT_FOCUSABLE`, so
  the app underneath keeps focus and its keyboard. A folded panel stays attached (1×1, alpha 0,
  not touchable) so it keeps receiving phrases. Runs `SpeechRecognizer`, restarting after each
  phrase until Stop (5 alternatives requested; used by Check). Bridge `AFSPanel`; events into
  `window.KB` (onState, onPartial, onPhrase, onPanel, onPushed, onClaude).
- `DictationAccessibility.java` — optional. Tracks the last editable field the user touched and
  the keyboard's bounds. On Push, finds the focused editable field (active window, then every app
  window incl. a tree search, then the last touched field) and pastes (clipboard + ACTION_PASTE), falling back to ACTION_SET_TEXT. Adds a leading
  space after a word and always a trailing space. Without it, Push copies to the clipboard. When no field is found the panel shows a short
  diagnostic (window types, packages, focused node classes).
- `DictationStore.java` — files in `files/dictation/`: `recordings/<id>.json`, `state.json`
  (`liveId`, `prepId`), `transcript.txt` (raw backup of every phrase).
- `ClaudeClient.java` — Messages API call (key, model in prefs `dictation`). Used for Check
  (forced tool `report_misheard`) and Key points (plain text with a `Title:` line).
- `DictationPlugin.java` — app page API: status, permissions, show/hide bubble, settings,
  library (list/load/save/remove/state/setState), claude, copy/share.
- `kbcore.js` — shared recording logic: formatting (period + space at each pause, sentence
  capitals, paragraphs), flags (speech-engine alternatives diffed with an LCS; Claude flags
  mapped by line + quote), edits, request builders. Tested by `scripts/validate-dictation.mjs`.
- `panel.js` — Live / Prep / Library UI, undo, flag review popover, push.
- `index.html` + `app.js` — setup, settings (API key, model, context, formatting, engine),
  Library with detail view (edit title/text/key points, generate key points, copy, share,
  put in Prep, delete), raw backup.

## Notes
- Move to prep never stops recording: the next phrase starts a new Live recording.
- Editing the transcript in the app turns it into one "fixed" block shown exactly as typed.
- Build 18 had an input-method keyboard version; build 19 replaced it with the floating button.
- Build 21 (Boox keyboard lag after recording a while): partials only sent/drawn while the panel
  is open and at most ~1/s (each redraw is an e-ink refresh); folded panel draws nothing; Live
  shows only the last 40 phrases; Live saved every 15 s (and on stop/fold/move/actions) instead
  of per phrase, no fsync; accessibility listens only to focus + window changes, never keystrokes.
- Build 22: Live's buttons are Prep ▸ / Clear / Undo. Prep ▸ while recording calls native `cut()`
  (recognizer.stopListening → final phrase → `KB.onCut`), so the sentence being spoken ends up
  in the segment; then the segment moves to Prep and is processed automatically (local check +
  Claude check and key points in parallel, if a key is set). Clear removes the Live recording;
  Undo restores it, keeping anything heard since after it.
