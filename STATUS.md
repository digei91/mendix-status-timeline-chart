# STATUS - Mendix Chart Widget

_Updated 2026-11-02 (v1.4.0). Keep this short: replace, don't append (history goes in HISTORY.md)._

## Current state
- v1.4.0: Export button (PNG, copy image, CSV, print/PDF) of exactly what is on screen; fixed: legend-hidden
  statuses came back on every redraw. `dist\1.4.0\digei.StatusTimelineChart.mpk`, 24 tests, lint clean, export
  test `tests\harness\cdp-export.mjs` passes. Pushed 2026-11-02.
- v1.3.0: user options pop-up (⚙ Options: counting, period, titles, date format, legend, chart style), new
  "User options" tab (showSwitcher, showOptions, offer*, rememberChoices, saveIn browser|attribute,
  choicesAttribute JSON keyed by widget name, onChoicesSaved). All tooltips <= ~116 chars (Studio Pro overlaps
  longer ones). Toolbox icons (VectorCraft, assets\icon). `dist\1.3.0\digei.StatusTimelineChart.mpk`, 20 tests,
  lint clean, screenshots OK. Pushed 2026-11-02 (repo holds only the latest .mpk). Note: rememberStyle (v1.2.0) was renamed rememberChoices.
- v1.2.0: new chart style "Columns" (side by side, key `columns`; "Stacked bars" renamed "Stacked columns", key
  still `bars`) + on-page style switcher (showSwitcher, offerBars/Columns/Area/Lines, rememberStyle in localStorage
  key `stcChartStyle:<widget name>`). `dist\1.2.0\digei.StatusTimelineChart.mpk`. 17 tests, lint clean.
  Built, screenshot-checked and pushed 2026-11-02 (repo holds only the latest .mpk).
- v1.1.0 = generic **Status Timeline Chart** (`digei.statustimelinechart.StatusTimelineChart`):
  `dist\1.1.0\digei.StatusTimelineChart.mpk`. No app-specific names (Ticket/Lane/AuditLogging) left.
  Settings: statusValue, itemId, statuses, statusName, statusColor, statusColors, hiddenStatuses, statusOrder.
- Studio Pro dialog fix: every caption/description is one line in the XML (multi-line text showed indented and
  hid the first "What to count" option). prettier.config.js has printWidth 1000 for *.xml so it can't come back.
- Since v1.1.0: eslint clean (run with ESLINT_USE_FLAT_CONFIG=false; `npm run lint` trips on ESLint 9).
- GitHub: https://github.com/digei91/mendix-status-timeline-chart (renamed from mendix-ticket-status-chart, old URL
  redirects; main branch, commits as digei <digei1991@gmail.com>). v1.1.0 pushed 2026-11-02.
- Old v1.0.0 .mpk removed from the repo; a local copy stays in `dist\1.0.0` (dist is git-ignored).

## Next step
- Proposed next: time range + finer columns (Year -> months, Month -> days); waiting for user's OK.
- User tests in Studio Pro: delete old .mpk, place the widget on Reporting_Overview, check dialog look + switcher.
- Optional: add LICENSE + GitHub Release.
