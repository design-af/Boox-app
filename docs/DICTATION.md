# Dictation (AFS Dictation floating button)

Live transcription of talks over any app, with the user's own keyboard still in use.
Flow: **Live → Prep → Push**, every recording kept in a **Library**.

## Parts
- `DictationService.java` — foreground service (type microphone). Draws a draggable bubble
  (tap = open/close panel, long-press = start/stop recording, drag = move) and a panel window
  (WebView running `public/tools/dictation/panel.html`). Both windows are `FLAG_NOT_FOCUSABLE`, so
  the app underneath keeps focus and its keyboard. A folded panel stays attached (1×1, alpha 0,
  not touchable) so it keeps receiving phrases. Runs `SpeechRecognizer`, restarting after each
  phrase until Stop (5 alternatives requested; used by Check). Bridge `AFSPanel`; events into
  `window.KB` (onState, onPartial, onPhrase, onPanel, onPushed, onClaude).
- `DictationAccessibility.java` — optional. On Push, finds the focused editable field in any
  window and pastes (clipboard + ACTION_PASTE), falling back to ACTION_SET_TEXT. Adds a leading
  space after a word and always a trailing space. Without it, Push copies to the clipboard.
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
