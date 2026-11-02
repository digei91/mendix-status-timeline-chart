# STATUS - Mendix Chart Widget

_Updated 2026-10-30. Keep this short: replace, don't append (history goes in HISTORY.md)._

## Current state
- v1.0.0 built (release): `dist\1.0.0\digei.TicketStatusChart.mpk`. 14 unit tests pass, lint clean,
  browser harness + Studio Pro preview checked with screenshots.
- Not yet tested in Studio Pro (not on this laptop).

## Next step
- User imports the .mpk in their app and sets it up per README. Open questions to confirm there:
  1. Can Ticket ID be picked two associations deep (LogLine → Log → Ticket)? If not: README alternatives.
  2. What exactly is in LogLine/NewValue for a lane change (id, [id], or name)? Ids need the Lanes list.
