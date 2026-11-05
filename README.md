# Status Timeline Chart (Mendix 10.24 pluggable widget)

Shows how many items are in each status per day / week / month / quarter / year, counted straight from a list of
status-change records (an audit log, a history entity, ...). No helper entities, no microflows. Every setting has a
tooltip in Studio Pro.

Widget file: `dist\1.5.1\digei.StatusTimelineChart.mpk`

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
- **Time range** + **Range length**: how far back the chart goes, e.g. Year + 1 = the last year, Month + 6 = the last
  6 months (0 = everything since the first change). **Range ends**: today or the period of the last change.
- **Column per**: the size of one column. *Auto* (default) keeps one column per range unit when that gives 4 or more
  columns, and goes one step finer for short ranges:

  | Time range | Auto: one column per |
  |---|---|
  | 1 week / 1 month | day |
  | 1 quarter | week |
  | 1-3 years | month |
  | 4+ of anything | the range unit itself (e.g. last 6 months = 6 monthly columns) |

  A column is never bigger than the whole range: "last 7 days per year" uses days (Studio Pro warns, and the
  Options pop-up only offers sizes that fit). When the first column starts before the range (last 6 weeks per
  month), *Changes per period* counts only the changes inside the range.

- With an empty **Date label format** the axis has two lines: short column labels (`5`, `W45`, `Jan`) and, once below
  them, the month or year they belong to (`November 2026`, `2026`), thinned out automatically when crowded.
- At most 400 columns: longer ranges show the newest 400 and a hint (e.g. "last 3 years per day").
- **Week starts on**: for week ranges and week columns.
- **Chart style**: *Stacked columns* (statuses on top of each other), *Columns* (statuses side by side in each
  period), *Stacked area*, or *Lines* (one per status). **Show totals** writes the period total above each column or
  group (or adds a dashed Total line in line style).

### User options tab

Lets the people using the app change the chart on the page. The settings in the other tabs are the starting values.

- **Show style switcher**: buttons above the chart to switch the chart style (icons only on narrow screens).
- **Show options button**: a ⚙ button that opens a small pop-up with What to count, Period, Periods to show, Last
  period, Chart style, Title, X/Y axis titles, Date label format, Show legend and Legend position. Changes show
  right away; **Reset to defaults** goes back to the Studio Pro values. The pop-up closes on a click outside or Esc.
- **Styles users may pick**: which styles the switcher and the pop-up offer (the Chart style is always allowed).
- **Export** (Show export button): an Export button with *Download image (PNG)*, *Copy image*, *Download data
  (CSV)* and *Print or save as PDF*. Every export shows exactly what the user sees at that moment: the current
  options, and without statuses hidden by clicking the legend.
  - Image: the chart redrawn sharp (2x) on white, with title and an optional "Exported 2026-11-02 16:20 · Month ·
    last 6 periods · Snapshot at period end" line (**Add "Exported on" line**).
  - Copy image: needs https or localhost; otherwise the user gets a short message and can use Download image.
  - CSV: `;` separated, UTF-8, opens directly in Excel; one row per period, one column per visible status + Total.
  - Print/PDF: only this chart and its data table are printed; choose "Save as PDF" in the print dialog.
  - **File name**: `{title}` and `{date}` are filled in, e.g. `Tickets per lane - 2026-11-02.png`.
- **Remember user choices**: keep what each user picked, also after a reload.
- **Save choices in**:
  - *Browser* (default): nothing to set up. Per user and per browser, so another PC starts from the defaults.
  - *Database attribute*: follows the user to every device. Setup:
    1. Add an entity, e.g. `ChartPreferences`, with an **unlimited String** attribute `Choices` and an association
       to `Administration.Account` (or `System.User`).
    2. Put the widget inside a **data view** whose data source is a nanoflow/microflow that returns the current
       user's `ChartPreferences` object (create it the first time).
    3. **Choices attribute** = `Choices`; **On choices changed** = a nanoflow that commits the object.
    One attribute can serve all charts: it holds JSON keyed by widget name, e.g.
    `{"chartPerMonth": {"period": "week"}, "chartPerTeam": {"showLegend": false}}`.

Only values that differ from the Studio Pro settings are stored, so later changes in Studio Pro still reach users who
never touched that setting.

### Statuses tab

- **Status colors**: `Open=#E74C3C; In progress=#F39C12; Done=#27AE60` (others use the default palette).
- **Hide statuses**: `Done; Cancelled`. In snapshot mode Done only grows, so hiding it shows the open work better.
  Changes with an empty new status are grouped as `(empty)`.
- **Status order**: only used without a Statuses list. First = bottom of the stack.

### Axes and legend tab

Axis titles, date label format (`MMM yyyy`, `dd/MM`, `'Week' W`, `'Q'Q yyyy`, ...), legend on/off and position.
Clicking a status in the legend hides it; the totals update.

## Notes

- The widget has its own Toolbox picture (stacked columns on a time axis), for light and dark Studio Pro.
  Sources: `assets\icon\*.svg`, exported with VectorCraft to `src\StatusTimelineChart.{icon,tile}[.dark].png`.

- All objects of the data source are loaded (no paging), so filter with XPath for very large logs.
- Deleted items are not removed from the snapshot (their last status keeps counting). Hide that status or filter
  them out with XPath if needed.
- Hovering shows every status for that period plus the total.

## Develop

```
npm install
npm run build      # dev build  -> dist\1.5.1\digei.StatusTimelineChart.mpk
npm run release    # minified build (use this for the app)
npm test           # unit tests for the counting logic
npm run lint
```

`tests\harness\index.html` renders the built widget with 140 fake items (status ids like an audit log) in 4
variants; bundle it with `npx rollup --config tests/harness/rollup.harness.mjs` first.
