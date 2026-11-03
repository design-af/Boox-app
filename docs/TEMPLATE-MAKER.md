# Template Maker

Makes Boox Notes backgrounds with the notebook's name on every page. Notes has no template
variables, so each notebook gets its own template with the name baked in.

## Files
- `public/tools/templates/render.js` — pure drawing (no DOM). All sizes in mm, converted with the page PPI.
- `public/tools/templates/pdf.js` — lossless PDF writer (8-bit gray images, FlateDecode via `CompressionStream`). Identical pages share one image.
- `public/tools/templates/app.js` + `index.html` — UI. Settings and saved setups in localStorage (`afs-template-maker-v1`).
- `android/.../TemplateFilesPlugin.java` — native `TemplateFiles` plugin: `info` (screen size/PPI, folder, saved files), `save` (replaces same name), `share`.
- `scripts/validate-templates.mjs` — renders every pattern × header × watermark × footer at four sizes against a mock canvas and checks the PDF structure. Runs in `npm test`.

## Features
- Name placement: header (left / centre / right / black bar / label box), watermark (centre / diagonal / repeat / spine), footer (name / page number). Space above the header (added to the top margin).
- Second line (build 15): its own alignment (match name / left / centre / right), background (none / grey band / black band / outline box / black tag), text size and space above. Tokens `{date} {year} {page} {pages}`.
- Date field (build 17): on/off, a label (Date, Day, Entry…) before a write-in line, and optional S M T W T F S to circle. Sits opposite the name in the header, or on its own row when there's no name header. Older date settings migrate via `migrate()`.
- Line and watermark shades (build 17) use e-ink grey levels (multiples of 17). Builds 14–16 had the shade buttons' value and label swapped, so tapping one saved a word instead of a grey; `migrate()` drops those values.
- Patterns: blank, lined (optional margin line), dot grid, square grid, engineering (heavy line every N), isometric, Cornell, meeting, to-do, architectural title block (project / sheet / date / scale).
- Spacing, line shade and weight, margins, typeface (bundled IBM Plex Sans/Mono, Spectral), bold.
- Paper: this tablet's real screen size and PPI, Boox presets, A4/Letter; portrait or landscape; PPI override.
- Output: PNG, or PDF (1–200 pages; many pages = a ready-made notebook with page numbers). Batch: one template per name.
- Destinations: the AFS Templates folder, or the share sheet. In a browser: download.

## Template folder
Boox Notes has no fixed folder it reads custom templates from, so the app saves to one folder it owns:
**Documents/AFS Templates** on internal storage (build 16). On Android 10+ it writes through MediaStore,
so no storage permission is needed; a file with the same name is overwritten in place. In Notes:
open the notebook → Template → Import → Documents › AFS Templates.

Builds 14–15 asked for "All files access" and guessed at Notes folders; that permission and code are gone.
