# HISTORY - Mendix Chart Widget

## 2026-10-30
- Request: a chart widget easier than the Charts module, tooltips on all settings. Narrowed to "tickets per
  status per period". Data: AuditLogging LogLine (many per ticket, NewValue/OldValue), Log with user-added
  association to Ticket, status = Lane/Name (String).
- Built "Ticket Status Chart" v1.0.0: modes Lane snapshot / Moves per period; Day–Year periods; stacked bars,
  stacked area, lines; optional Lanes list maps ids in NewValue to names (also "[id]"), gives order + colors;
  lane colors / hide / order settings; totals on top; tooltip with total; editorConfig hides unused settings and
  errors when snapshot has no Ticket ID.
- Node 24 vs tools' Node 22 requirement → scripts call rollup/jest directly. Missing lzma native binary copied in.
- Verified: jest 14/14, eslint clean, headless Edge screenshots of 4 variants, hover tooltip (CDP), design preview.

## 2026-11-02
- User tested in Studio Pro 10.24.9 (photo): first "What to count" option had no label, long tooltips were
  indented. Cause: prettier wrapped XML text over several lines; Studio Pro shows the line breaks/indent.
- v1.1.0: full rename to generic "Status Timeline Chart" (new widget id, files, CSS class
  widget-status-timeline-chart / stc-, setting keys lane*→status*, ticketId→itemId), neutral examples, mode
  labels "Snapshot at period end" / "Changes per period", all XML texts on one line, XML printWidth 1000.
- Verified: jest 14/14, eslint clean (legacy mode), headless Edge screenshots of harness + design preview.
  The Studio Pro dialog itself is not verifiable here (no Studio Pro).
- Removed old v1.0.0 .mpk from the repo; renamed GitHub repo to digei91/mendix-status-timeline-chart (via API, gh not installed) and updated the remote.
- Removed old v1.0.0 .mpk from the repo; renamed GitHub repo to digei91/mendix-status-timeline-chart (API; gh CLI not installed) and updated the remote.
- v1.2.0: user wanted a "column" chart (their picture = clustered columns) and switching on the page. Added
  style `columns` (side-by-side bars, totals above each group), renamed "Stacked bars" to "Stacked columns" (key kept),
  StyleSwitcher component (segmented buttons with icons, icon-only under 520px container width, aria-pressed),
  settings group "Style switcher", utils/styles.ts + 3 tests. Verified: 17 tests, lint, harness screenshots incl.
  ?click=Lines / ?click=Columns, narrow view, Studio Pro preview with switcher.
