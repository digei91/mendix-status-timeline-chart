# Mendix Chart Widget

Generic pluggable widget "Status Timeline Chart" for **Mendix 10.24.9** (was "Ticket Status Chart" until v1.1.0):
counts items per status per period from status-change records and draws stacked bars / stacked area / lines with
Chart.js 4.5.1. Keep it generic: no app-specific entity names in settings, texts or examples. (The user's own app
uses AuditLogging `LogLine` + `Log`, Log → Ticket, `Lane/Name`.)

## Key files
- `src\StatusTimelineChart.xml` – all settings + tooltip texts (descriptions), each on ONE line.
- `src\utils\aggregate.ts` – snapshot / moves counting, id → status name mapping, status order.
- `src\utils\periods.ts` – period start/add, ISO week, label formatter, Auto column size, short/group labels.
- `src\components\StatusChart.tsx` – Chart.js rendering (totals plugin, tooltip).
- `src\StatusTimelineChart.editorPreview.tsx` / `.editorConfig.ts` – Studio Pro preview, hide/validate settings.
- `README.md` – user setup guide. Output: `dist\1.5.0\digei.StatusTimelineChart.mpk`.
- `src\components\StyleSwitcher.tsx` + `src\utils\styles.ts` – on-page chart style switcher (v1.2.0).
- `src\components\OptionsPanel.tsx` + `src\utils\choices.ts` – user options pop-up and saving (v1.3.0).
- `src\components\ExportMenu.tsx` + `src\utils\export.ts` – export (PNG, copy, CSV, print) (v1.4.0).
- `assets\icon\*.svg` – Toolbox picture sources; PNGs in `src\StatusTimelineChart.{icon,tile}[.dark].png`.

## Gotchas
- Tools 10.24.1 demand Node 22; laptop has Node 24, so npm scripts call rollup/jest directly (skips the check).
- npm did not unpack `@napi-rs/lzma-win32-x64-msvc` (needed to zip the .mpk); it was copied in by hand from
  `npm pack`. Redo that after a fresh `npm install` if the build fails with "Cannot find module ...lzma".
- Files written by Python on Windows get CRLF; run prettier --write before lint.
- Studio Pro shows line breaks inside XML captions/descriptions literally (indented text, hidden radio labels):
  keep each on one line. prettier.config.js sets printWidth 1000 for *.xml. Keep descriptions <= ~120 chars:
  Studio Pro shows about two lines and longer text overlaps the next setting.
- ESLint 9 + .eslintrc.js: run eslint with ESLINT_USE_FLAT_CONFIG=false (plain `npm run lint` crashes).
- Export test: `node tests\harness\cdp-export.mjs <outDir>` (headless Edge, real downloads + clipboard).
- Harness params: ?ranges=1 (one chart per time range), ?only=7, ?click=Lines, ?open=1 (or =2), ?demo=1, ?probe=1 (overflow check), ?w=320 (narrow width).
- Visual test: `tests\harness` (index.html widget, preview.html Studio Pro preview, cdp-hover.mjs for hover
  screenshots with headless Edge).

## Start here
- Read `STATUS.md` first. Global rules: `~/.claude/CLAUDE.md` + memory note `work-rules`.
