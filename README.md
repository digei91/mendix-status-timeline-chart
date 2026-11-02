# Status Timeline Chart (Mendix 10.24 pluggable widget)

Shows how many items are in each status per day / week / month / quarter / year, counted straight from a list of
status-change records (an audit log, a history entity, ...). No helper entities, no microflows. Every setting has a
tooltip in Studio Pro.

Widget file: `dist\1.1.0\digei.StatusTimelineChart.mpk`

## Install

1. Copy `digei.StatusTimelineChart.mpk` into the `widgets\` folder of your Mendix app.
2. In Studio Pro: **App > Synchronize App Directory** (F4).
3. The widget is in the Toolbox under **Charts > Status Timeline Chart**. It does not need a data view around it.

**Upgrading from Ticket Status Chart 1.0.0:** this is a new widget (new id and setting names). Delete
`digei.TicketStatusChart.mpk` from `widgets\`, remove the old widget from your pages, place the new one and fill in
the settings again.

## What your model needs

One entity with **one object per status change** that gives (directly or over associations):

- the **date** of the change,
- the **new status** (its name, an enum, or the status object's id),
- something **unique per item** (only for snapshot mode), e.g. the item's number.

Optionally an entity with **all statuses** (name, sort order, color) for ordering, colors and id → name mapping.

## Settings

### Data tab

| Setting | What to pick |
|---|---|
| **Status changes** | Database source on your change/audit entity, with an XPath that keeps only status changes (and limits the time span for big logs) |
| **Change date** | when the change happened |
| **New status** | the status the item moved into |
| **Item ID** | something unique per item (needed for "Snapshot at period end") |
| **Statuses** (optional) | Database source on your status entity, sorted in your board order |
| **Status name** | the status's display name |
| **Status color** (optional) | a String attribute with a CSS color, e.g. `#E74C3C` |

In snapshot mode, load a few months **before** the first period you show, so items that moved earlier are counted.

**New status holding ids.** Audit modules often store the object id of an associated status (sometimes in brackets,
e.g. `[281474976710657]`) instead of its name. With the **Statuses** list filled in, the widget turns those ids into
names. Without it you would see the ids in the legend.

**If Studio Pro does not let you reach the item over two associations**, put a String attribute with the item key
on the change entity's parent (or the change entity itself) and pick that.

### Chart tab

- **What to count**
  - *Snapshot at period end* (default): at the end of each period, every item counts once, in the status of its
    latest change. "End of March: 12 Open, 7 In progress, 40 Done."
  - *Changes per period*: how many changes into each status happened in that period. "In March 9 items moved to Done."
- **Period**, **Periods to show** (0 = everything), **Last period** (today or the last change), **Week starts on**.
- **Chart style**: stacked bars, stacked area, or one line per status. **Show totals** writes the total on top
  (or adds a dashed Total line in line style).

### Statuses tab

- **Status colors**: `Open=#E74C3C; In progress=#F39C12; Done=#27AE60` (others use the default palette).
- **Hide statuses**: `Done; Cancelled`. In snapshot mode Done only grows, so hiding it shows the open work better.
  Changes with an empty new status are grouped as `(empty)`.
- **Status order**: only used without a Statuses list. First = bottom of the stack.

### Axes and legend tab

Axis titles, date label format (`MMM yyyy`, `dd/MM`, `'Week' W`, `'Q'Q yyyy`, ...), legend on/off and position.
Clicking a status in the legend hides it; the totals update.

## Notes

- All objects of the data source are loaded (no paging), so filter with XPath for very large logs.
- Deleted items are not removed from the snapshot (their last status keeps counting). Hide that status or filter
  them out with XPath if needed.
- Hovering shows every status for that period plus the total.

## Develop

```
npm install
npm run build      # dev build  -> dist\1.1.0\digei.StatusTimelineChart.mpk
npm run release    # minified build (use this for the app)
npm test           # unit tests for the counting logic
npm run lint
```

`tests\harness\index.html` renders the built widget with 140 fake items (status ids like an audit log) in 4
variants; bundle it with `npx rollup --config tests/harness/rollup.harness.mjs` first.
