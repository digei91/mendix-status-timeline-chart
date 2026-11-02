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
