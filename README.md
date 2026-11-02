# Ticket Status Chart (Mendix 10.24 pluggable widget)

Shows how many tickets are in each lane (status) per day / week / month / quarter / year, counted straight from the
status-change records (e.g. AuditLogging `LogLine`). No helper entities, no microflows. Every setting has a tooltip in
Studio Pro.

Widget file: `dist\1.0.0\digei.TicketStatusChart.mpk`

## Install

1. Copy `digei.TicketStatusChart.mpk` into the `widgets\` folder of your Mendix app.
2. In Studio Pro: **App > Synchronize App Directory** (F4).
3. The widget is in the Toolbox under **Charts > Ticket Status Chart**. It does not need a data view around it.

## Setup for the AuditLogging + Lane model

### Data tab

| Setting | What to pick | Example |
|---|---|---|
| **Status changes** | Database, entity `AuditLogging.LogLine`, with an XPath so only lane changes come in | `[Member = 'MyModule.Ticket_Lane']` |
| **Change date** | the date of the Log the line belongs to | `LogLine_Log / Log / DateTime` |
| **New lane** | the new value of the change | `NewValue` |
| **Ticket ID** | something unique per ticket, over your Log → Ticket association | `LogLine_Log / Log / Log_Ticket / Ticket / TicketNumber` |
| **Lanes** (optional) | Database, entity `Lane`, sorted in your board order | sort on `Lane/SortOrder` |
| **Lane name** | the lane's name | `Name` |
| **Lane color** (optional) | a String attribute with a CSS color, if your Lane has one | `#E74C3C` |

How to find the exact `Member` text: open one LogLine of a lane change (e.g. in a data grid) and copy what is in
`Member`. Add a date limit for big logs, e.g.
`[Member = 'MyModule.Ticket_Lane'][AuditLogging.LogLine_Log/AuditLogging.Log/DateTime > '[%BeginOfCurrentYear%]']`.
In snapshot mode, keep a few months **before** the first period you show, so tickets that moved earlier are counted.

**About NewValue holding ids.** For associations AuditLogging often stores the lane's object id (sometimes in
brackets, e.g. `[281474976710657]`) instead of its name. With the **Lanes** list filled in, the widget turns those
ids into lane names. Without it you would see the ids in the legend.

**If Studio Pro does not let you pick Ticket ID two associations deep** (`LogLine → Log → Ticket`), use one of these:
- an attribute on `Log` that already identifies the ticket (some audit modules store the object's id, e.g.
  `Log/ReferenceId`), or
- add a String attribute `TicketKey` on `Log`, fill it where you create the Log ↔ Ticket association, and pick
  `LogLine_Log / Log / TicketKey`.

### Chart tab

- **What to count**
  - *Lane snapshot* (default): at the end of each period, every ticket counts once, in the lane of its latest change.
    "End of March: 12 Open, 7 In progress, 40 Done."
  - *Moves per period*: how many changes into each lane happened in that period. "In March 9 tickets moved to Done."
- **Period**, **Periods to show** (0 = everything), **Last period** (today or the last change), **Week starts on**.
- **Chart style**: stacked bars, stacked area, or one line per lane. **Show totals** writes the total on top
  (or adds a dashed Total line in line style).

### Lanes tab

- **Lane colors**: `Open=#E74C3C; In progress=#F39C12; Done=#27AE60` (lanes without a color use the default palette).
- **Hide lanes**: `Done; Cancelled`. In snapshot mode Done only grows, so hiding it shows the open work better.
  Changes with an empty NewValue are grouped as `(empty)`.
- **Lane order**: only used without a Lanes list. First = bottom of the stack.

### Axes and legend tab

Axis titles, date label format (`MMM yyyy`, `dd/MM`, `'Week' W`, `'Q'Q yyyy`, ...), legend on/off and position.
Clicking a lane in the legend hides it; the totals update.

## Notes

- All objects of the data source are loaded (no paging), so filter with XPath for very large logs.
- Deleted tickets are not removed from the snapshot (their last lane keeps counting). Hide that lane or filter them
  out with XPath if needed.
- Hovering shows every lane for that period plus the total.

## Develop

```
npm install
npm run build      # dev build  -> dist\1.0.0\digei.TicketStatusChart.mpk
npm run release    # minified build (use this for the app)
npm test           # unit tests for the counting logic
npm run lint
```

`tests\harness\index.html` renders the built widget with 140 fake tickets (AuditLogging-style ids) in 4 variants;
bundle it with `npx rollup --config tests/harness/rollup.harness.mjs` first.
