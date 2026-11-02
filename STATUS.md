# STATUS - Mendix Chart Widget

_Updated 2026-11-02. Keep this short: replace, don't append (history goes in HISTORY.md)._

## Current state
- v1.1.0 = generic **Status Timeline Chart** (`digei.statustimelinechart.StatusTimelineChart`):
  `dist\1.1.0\digei.StatusTimelineChart.mpk`. No app-specific names (Ticket/Lane/AuditLogging) left.
  Settings: statusValue, itemId, statuses, statusName, statusColor, statusColors, hiddenStatuses, statusOrder.
- Studio Pro dialog fix: every caption/description is one line in the XML (multi-line text showed indented and
  hid the first "What to count" option). prettier.config.js has printWidth 1000 for *.xml so it can't come back.
- 14 unit tests pass, eslint clean (run with ESLINT_USE_FLAT_CONFIG=false; `npm run lint` trips on ESLint 9).
- Old v1.0.0 (Ticket Status Chart) .mpk still in `dist\1.0.0`. GitHub repo still named mendix-ticket-status-chart.
- v1.1.0 committed and pushed to GitHub (main) on 2026-11-02.

## Next step
- User tests v1.1.0 in Studio Pro: delete old .mpk, re-place widget on Reporting_Overview, check the dialog look.
- Optional: add LICENSE + GitHub Release for v1.1.0.
