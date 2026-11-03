# AFS Custom Boox Tools

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

Android's back button can be handled from a plain page through `window.Capacitor.Plugins.App`
(see `goBack()` in the ARE tool).

## Never change

The signing key (GitHub secrets `ANDROID_KEYSTORE_*`), the `applicationId`, or the
`versionCode = run number` rule. Changing any of them breaks in-place updates.
