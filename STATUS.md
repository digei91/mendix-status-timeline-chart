# STATUS - Mendix Chart Widget

_Updated 2026-11-02. Keep this short: replace, don't append (history goes in HISTORY.md)._

## Current state
- v1.1.0 = generic **Status Timeline Chart** (`digei.statustimelinechart.StatusTimelineChart`):
  `dist\1.1.0\digei.StatusTimelineChart.mpk`. No app-specific names (Ticket/Lane/AuditLogging) left.
  Settings: statusValue, itemId, statuses, statusName, statusColor, statusColors, hiddenStatuses, statusOrder.
- Studio Pro dialog fix: every caption/description is one line in the XML (multi-line text showed indented and
  hid the first "What to count" option). prettier.config.js has printWidth 1000 for *.xml so it can't come back.
- 14 unit tests pass, eslint clean (run with ESLINT_USE_FLAT_CONFIG=false; `npm run lint` trips on ESLint 9).
- GitHub: https://github.com/digei91/mendix-status-timeline-chart (renamed from mendix-ticket-status-chart, old URL
  redirects; main branch, commits as digei <digei1991@gmail.com>). v1.1.0 pushed 2026-11-02.
- Old v1.0.0 .mpk removed from the repo; a local copy stays in `dist\1.0.0` (dist is git-ignored).

## Next step
- User tests v1.1.0 in Studio Pro: delete old .mpk, re-place widget on Reporting_Overview, check the dialog look.
- Optional: add LICENSE + GitHub Release for v1.1.0.
