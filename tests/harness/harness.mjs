// Browser test page: renders the built widget with mocked Mendix props (status-change records with object ids).
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { StatusTimelineChart } from "../../dist/tmp/widgets/digei/statustimelinechart/StatusTimelineChart.mjs";

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const STATUSES = [
    { id: "281474976710657", name: "Open" },
    { id: "281474976710658", name: "In progress" },
    { id: "281474976710659", name: "Review" },
    { id: "281474976710660", name: "Done" }
];

// 140 items created over the last 12 months, each walking Open -> In progress -> Review -> Done (sometimes back)
const changeRows = [];
const now = new Date(2026, 9, 30);
for (let t = 1; t <= 140; t++) {
    let date = new Date(now.getTime() - rand() * 365 * 86400000);
    let status = 0;
    changeRows.push({ id: "L" + changeRows.length, item: "T" + t, date, newValue: STATUSES[0].id });
    while (status < 3) {
        date = new Date(date.getTime() + (2 + rand() * 40) * 86400000);
        if (date > now) break;
        status = rand() < 0.12 && status > 0 ? status - 1 : status + 1;
        changeRows.push({ id: "L" + changeRows.length, item: "T" + t, date, newValue: "[" + STATUSES[status].id + "]" });
    }
}

const list = items => ({ status: "available", items: items.map(i => ({ id: i.id })), _src: items });
const byId = src => new Map(src.map(s => [s.id, s]));
const changes = list(changeRows);
const statuses = list(STATUSES);
const lineIx = byId(changeRows);
const statusIx = byId(STATUSES);
const attr = (ix, f) => ({ get: item => { const v = f(ix.get(item.id)); return { value: v, displayValue: v == null ? "" : String(v) }; } });
const text = v => ({ status: "available", value: v });

const base = {
    name: "chart", class: "", changes,
    changeDate: attr(lineIx, r => r.date),
    statusValue: attr(lineIx, r => r.newValue),
    itemId: attr(lineIx, r => r.item),
    statuses, statusName: attr(statusIx, l => l.name), statusColor: undefined,
    mode: "snapshot", period: "month", periodCount: 12, endAt: "today", weekStart: "monday",
    chartStyle: "bars", height: 300, showTotal: true, showGrid: true,
    statusColors: "", hiddenStatuses: "", statusOrder: "", dateFormat: "",
    showLegend: true, legendPosition: "bottom",
    showSwitcher: false, offerBars: true, offerColumns: true, offerArea: true, offerLines: true, rememberStyle: false,
    yAxisTitle: text("Items")
};

const variants = [
    { title: text("1. Snapshot per month, stacked columns (default settings)") },
    { title: text("2. Snapshot, Done hidden, custom colors"), hiddenStatuses: "Done", statusColors: "Open=#E74C3C; In progress=#F39C12; Review=#8E44AD" },
    { title: text("3. Changes per week, lines + total, last 16 weeks"), mode: "moves", period: "week", periodCount: 16, chartStyle: "lines", legendPosition: "top" },
    { title: text("4. Snapshot per quarter, stacked area, no Statuses list"), period: "quarter", periodCount: 4, chartStyle: "area", statuses: undefined, statusName: undefined, statusValue: attr(lineIx, r => STATUSES.find(l => r.newValue.includes(l.id)).name), statusOrder: "Open; In progress; Review; Done", legendPosition: "right" },
    { title: text("5. Columns side by side, last 6 months"), chartStyle: "columns", periodCount: 6 },
    { title: text("6. Style switcher (starts as stacked columns)"), name: "switcherDemo", showSwitcher: true, periodCount: 6 }
];

const root = document.getElementById("root");
variants.forEach(v => {
    const cell = document.createElement("div");
    cell.className = "cell";
    root.appendChild(cell);
    createRoot(cell).render(h(StatusTimelineChart, { ...base, ...v }));
});
window.__changeRows = changeRows.length;

// ?click=Columns clicks that switcher button after rendering, to test switching
const click = new URLSearchParams(location.search).get("click");
if (click) {
    setTimeout(() => document.querySelector(`.stc-switch[title="${click}"]`)?.click(), 600);
}

