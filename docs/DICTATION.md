# Dictation (AFS Dictation keyboard)

Live, continuous speech-to-text that types into **any text field in any app** — built for transcribing a presenter into notes.

## How it works
- `DictationIME.java` is an Android input method (keyboard) named **AFS Dictation**. It runs Android's `SpeechRecognizer` and restarts it immediately after every phrase until the user taps Stop, so it never times out on pauses.
- Words in progress are shown as composing (underlined) text in the field and committed when the phrase ends. "Show words as they're heard" off = phrase-by-phrase commit only.
- Spacing and sentence capitals come from the text before the cursor. On Android 13+ it asks the engine for punctuation/formatting.
- Punctuation / New line tapped mid-phrase is queued and added after the phrase.
- Every committed phrase is appended to `files/dictation/transcript.txt` with a dated header per session (backup if a notes app loses text). The tool page shows, copies, shares and clears it.
- Engine: Auto (on-device if `isOnDeviceRecognitionAvailable`, Android 12+, else online), On-device, Online. On-device language errors fall back to online.
- "Silence start beeps" mutes music/notification/system streams while listening and restores them on Stop.
- The screen is kept on while listening; hiding the keyboard stops listening.
- Errors restart with back-off; network errors show a status and keep retrying.

## Setup (tool page `public/tools/dictation/`)
1. Allow microphone (`DictationPlugin.requestMic`).
2. Speech engine present (`SpeechRecognizer.isRecognitionAvailable`; manifest `<queries>` for `android.speech.RecognitionService`). On a Boox without Google apps: install the Google app or "Speech Recognition & Synthesis from Google".
3. Enable AFS Dictation in keyboard settings.
4. Switch to it (input method picker).

## Native API
`Capacitor.nativePromise("Dictation", …)`: `status`, `requestMic`, `openKeyboardSettings`, `openAppSettings`, `showPicker`, `setSettings {engine, live, mute, cap, lang}`, `transcript`, `copyTranscript`, `shareTranscript`, `clearTranscript`.
Settings are SharedPreferences `dictation`, read by the IME at each Start.
