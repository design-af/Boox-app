# AFS Custom Boox

One Android app for the Boox Air 6C that holds a set of e-ink tools. App ID `af.design.boox`.
Every push to `main` builds a signed APK and publishes it as the latest GitHub release; the app
offers the update on launch.

## Layout

```
index.html, src/        Hub: tool launcher, version, update check (Vite-built)
public/tools/<name>/    One folder per tool, copied into the APK unchanged
scripts/                Checks run by `npm test` before every build
docs/                   Per-tool notes (docs/ARE-HANDOFF.md)
```

## Tools

| Tool | Folder | Notes |
|---|---|---|
| ARE Prep Tools | `public/tools/are/` | Plain HTML + data files, no build step. Content checked by `scripts/validate-are.mjs`. |

## Adding a tool

1. Make `public/tools/<name>/index.html`. Keep it self-contained and offline — no CDN fonts or scripts.
2. Link back to the hub with `../../index.html`, and add a hidden-attribute reset if the page uses `hidden`.
3. Add a card for it in the root `index.html`.
4. If it has content worth validating, add a script under `scripts/` and chain it into `npm test`.

Plain pages get Capacitor's bridge but not `Capacitor.Plugins` (that comes from `@capacitor/core`).
Call native code through the bridge directly: `Capacitor.addListener("App", "backButton", fn)` and
`Capacitor.nativePromise("Narrator", "speak", {...})` — see `goBack()` and `speech.js` in the ARE tool.

## Native code

`android/app/src/main/java/af/design/boox/` holds a local Capacitor plugin, `Narrator`
(`NarratorPlugin.java`), registered in `MainActivity`. It drives `NarrationService`, a foreground
media-playback service that reads a queue aloud with Android TextToSpeech, so ARE chapters and the
hands-free card drill keep playing with the screen off. It needs a TTS engine installed on the tablet.

## Never change

The signing key (GitHub secrets `ANDROID_KEYSTORE_*`), the `applicationId`, or the
`versionCode = run number` rule. Changing any of them breaks in-place updates.

## Template Maker
Note backgrounds with the notebook name on every page. See `docs/TEMPLATE-MAKER.md`.
