# Aside Transcribe (Dictation tool)

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
- Build 25: app page split into tabs that fit the Boox screen without scrolling: **Library**
  (groups as black-headed boxes with their recordings, then ungrouped recordings by day; Select →
  Add to group / Ungroup / Delete; New group), **Setup**, **Settings**. Group view: rename, key
  points across all its recordings (`groupSummaryRequest`), copy/share everything, put key points
  in Prep, remove recordings, delete group (keeps recordings). Groups live in
  `files/dictation/groups.json` (`DictationStore.loadGroups/saveGroups`, plugin `groups` /
  `saveGroups`); a recording is in at most one group. The panel no longer has a Library tab.
  Live's Clear asks "Clear everything in Live?" first. Prep ▸ now waits for the speaker's own pause
  to end the sentence (forced after 12 s, gives up after 18 s) instead of cutting at the tap.
- Build 27:
  - Claude never runs on its own: Prep ▸ only does on-tablet checks (engine alternatives,
    unknown speaker turns). Check, Speakers and Summary call Claude when tapped.
  - Speaker marking: phrase `spk` starts a turn ("A", "B", … or "?"), names in `rec.speakers`.
    Live has a Speaking row (chips + "+ New"); a chip tapped mid-sentence marks the sentence being
    heard (pending.spk). Tap any word in Live (or "New speaker here" in Prep) to start a speaker
    there (`splitTurn`). Bubble double-tap = unknown turn "?" (badge on the bubble shows the
    current speaker once there is more than one). Prep: "?" turns and Claude's suggestions are
    `kind:"spk"` flags (pick a speaker, + New, Not a change); tap a label to rename (panel takes
    typing focus only while the field is open). Labels only appear once there is a second speaker;
    Push writes "Name: " at each turn. Speakers button = `speakerRequest` / `applySpeakers`.
  - Sleep: a watchdog restarts the speech engine if it goes quiet for 20 s; it also restarts on
    screen-on/unlock; a partial wake lock is held while recording; restarts go through one
    runnable (no duplicate restart chains); Prep ▸ on a stalled engine restarts it.
- Build 28 — symposium: Library → New symposium: add photos/screenshots of the programme
  (shrunk to 1568 px JPEG) and/or an event web page link (plugin `fetchPage` downloads it; text is
  extracted in the page), then "Read with Claude" (`symposiumRequest`, forced tool
  `report_symposium`). Review/edit event + sessions (time, title, speakers), then Create sessions:
  one group per session tagged `event`, `eventId`, `order`, `time`, `title`, `speakers`
  (`makeSessionGroups`). The Library shows each event as a heading with its sessions in order.
  Panel Live has a "Session" picker (state `sessionId`); Prep ▸ files the segment into that
  session's group (panel bridge `groups` / `saveGroups`).
- Builds 31–33:
  - A picked session's speakers name the Live chips (A = first listed; bracketed firms dropped);
    named speakers are labelled from the first sentence. Chips stay in letter order and scroll.
  - Prep clears after a successful Push (Undo restores; the recording stays in the Library).
  - Library rebuilt as drill-down screens: home (Unsorted, Symposiums, Groups) → Unsorted
    (Assign per recording or Select → Assign to… / Delete) → Symposium (rename, sessions, + Add
    session, delete → recordings to Unsorted) → Session/Group (time/title/speakers or name,
    + Add recordings from Unsorted, Remove, key points, copy/share, delete). groups.json now
    also keeps `events` (`ensureEvents`, `renameEvent`, `addSession`, `updateSession`,
    `deleteGroup`, `deleteEvent`, `unsortedIds`). Recording page's group picker is grouped by
    symposium.
- Build 35: "Keep the tablet awake while recording" (pref `keepAwake`, default on) holds a
  screen wake lock (SCREEN_DIM, deprecated but honoured) while recording, so the Boox screensaver
  doesn't kick in; off = partial wake lock only. Speech-engine error 9 (insufficient permissions)
  while recording is treated as the tablet sleeping: retry every ~3 s and restart on wake; only a
  really missing mic permission stops recording.
