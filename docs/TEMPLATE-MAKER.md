# Template Maker

Makes Boox Notes backgrounds with the notebook's name on every page. Notes has no template
variables, so each notebook gets its own template with the name baked in.

## Files
- `public/tools/templates/render.js` — pure drawing (no DOM). All sizes in mm, converted with the page PPI.
- `public/tools/templates/pdf.js` — lossless PDF writer (8-bit gray images, FlateDecode via `CompressionStream`). Identical pages share one image.
- `public/tools/templates/app.js` + `index.html` — UI. Settings and saved setups in localStorage (`afs-template-maker-v1`).
- `android/.../TemplateFilesPlugin.java` — native `TemplateFiles` plugin: `info`, `requestAllFiles`, `saveFile`, `saveToDownloads`, `share`, `openNotes`.
- `scripts/validate-templates.mjs` — renders every pattern × header × watermark × footer at four sizes against a mock canvas and checks the PDF structure. Runs in `npm test`.

## Features
- Name placement: header (left / centre / right / black bar / label box), watermark (centre / diagonal / repeat / spine), footer (name / page number). Second line with `{date} {year} {page} {pages}` tokens. Date: none / blank line / today.
- Patterns: blank, lined (optional margin line), dot grid, square grid, engineering (heavy line every N), isometric, Cornell, meeting, to-do, architectural title block (project / sheet / date / scale).
- Spacing, line shade and weight, margins, typeface (bundled IBM Plex Sans/Mono, Spectral), bold.
- Paper: this tablet's real screen size and PPI, Boox presets, A4/Letter; portrait or landscape; PPI override.
- Output: PNG, or PDF (1–200 pages; many pages = a ready-made notebook with page numbers). Batch: one template per name.
- Destinations: Notes template folder (needs Android "All files access"), Download/AFS Templates, share sheet. In a browser: download.

## Template folder
The plugin lists existing folders: `noteTemplate`, `Notes/Templates`, `note/template`, then any folder named like `*template*`
up to two levels deep. If none exists, `noteTemplate` is created. In Notes: open the notebook → Template → Local / Custom;
close and reopen Notes if a new file doesn't appear. Which folder Notes reads depends on the firmware — confirm on the tablet.
