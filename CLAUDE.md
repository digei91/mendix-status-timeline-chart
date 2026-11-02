# Mendix Chart Widget

Pluggable widget "Ticket Status Chart" for **Mendix 10.24.9**: counts tickets per lane (status) per period from
status-change records (user's model: AuditLogging `LogLine` + `Log`, Log → Ticket association they added,
`Lane/Name` String) and draws stacked bars / stacked area / lines with Chart.js 4.5.1.

## Key files
- `src\TicketStatusChart.xml` – all settings + tooltip texts (descriptions).
- `src\utils\aggregate.ts` – snapshot / moves counting, id → lane name mapping, lane order.
- `src\utils\periods.ts` – period start/add, ISO week, label formatter.
- `src\components\StatusChart.tsx` – Chart.js rendering (totals plugin, tooltip).
- `src\TicketStatusChart.editorPreview.tsx` / `.editorConfig.ts` – Studio Pro preview, hide/validate settings.
- `README.md` – user setup guide. Output: `dist\1.0.0\digei.TicketStatusChart.mpk`.

## Gotchas
- Tools 10.24.1 demand Node 22; laptop has Node 24, so npm scripts call rollup/jest directly (skips the check).
- npm did not unpack `@napi-rs/lzma-win32-x64-msvc` (needed to zip the .mpk); it was copied in by hand from
  `npm pack`. Redo that after a fresh `npm install` if the build fails with "Cannot find module ...lzma".
- Files written by Python on Windows get CRLF; run prettier --write before lint.
- Visual test: `tests\harness` (index.html widget, preview.html Studio Pro preview, cdp-hover.mjs for hover
  screenshots with headless Edge).

## Start here
- Read `STATUS.md` first. Global rules: `~/.claude/CLAUDE.md` + memory note `work-rules`.
