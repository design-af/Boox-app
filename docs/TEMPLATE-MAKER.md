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
- Name placement: header (left / centre / right / black bar / label box), watermark (centre / diagonal / repeat / spine), footer (name / page number). Space above the header (added to the top margin).
- Second line (build 15): its own alignment (match name / left / centre / right), background (none / grey band / black band / outline box / black tag), text size and space above. Tokens `{date} {year} {page} {pages}`.
- Date field (build 15): write-in line, `__ / __ / __` slots, line + M T W T F S S to circle, or today's date printed. Position: in the header opposite the name, its own row (with alignment), or the footer. Custom label (Date, Day, Entry… or none) and size. Shrinks to fit narrow pages. Build 14's single `date` setting is migrated by `migrate()`.
- Patterns: blank, lined (optional margin line), dot grid, square grid, engineering (heavy line every N), isometric, Cornell, meeting, to-do, architectural title block (project / sheet / date / scale).
- Spacing, line shade and weight, margins, typeface (bundled IBM Plex Sans/Mono, Spectral), bold.
- Paper: this tablet's real screen size and PPI, Boox presets, A4/Letter; portrait or landscape; PPI override.
- Output: PNG, or PDF (1–200 pages; many pages = a ready-made notebook with page numbers). Batch: one template per name.
- Destinations: Notes template folder (needs Android "All files access"), Download/AFS Templates, share sheet. In a browser: download.

## Template folder
The plugin lists existing folders: `noteTemplate`, `Notes/Templates`, `note/template`, then any folder named like `*template*`
up to two levels deep. If none exists, `noteTemplate` is created. In Notes: open the notebook → Template → Local / Custom;
close and reopen Notes if a new file doesn't appear. Which folder Notes reads depends on the firmware — confirm on the tablet.
