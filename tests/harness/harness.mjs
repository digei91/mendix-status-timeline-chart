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

// mock of an unlimited String attribute on a preferences object (database saving)
const db = {
    status: "available", readOnly: false, value: '{"otherWidget":{"period":"year"}}',
    setValue(v) { this.value = v; document.getElementById("db").textContent = "attribute value: " + v; }
};
const saved = { canExecute: true, execute() { window.__saves = (window.__saves || 0) + 1; document.getElementById("db").textContent += "  (on change action ran " + window.__saves + "x)"; } };

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
    showSwitcher: false, offerBars: true, offerColumns: true, offerArea: true, offerLines: true, showOptions: false, rememberChoices: false, saveIn: "browser",
    showExport: false, exportImage: true, exportCopy: true, exportCsv: true, exportPdf: true, exportFileName: "{title} - {date}", exportStamp: true,
    yAxisTitle: text("Items")
};

const variants = [
    { title: text("1. Snapshot per month, stacked columns (default settings)") },
    { title: text("2. Snapshot, Done hidden, custom colors"), hiddenStatuses: "Done", statusColors: "Open=#E74C3C; In progress=#F39C12; Review=#8E44AD" },
    { title: text("3. Changes per week, lines + total, last 16 weeks"), mode: "moves", period: "week", periodCount: 16, chartStyle: "lines", legendPosition: "top" },
    { title: text("4. Snapshot per quarter, stacked area, no Statuses list"), period: "quarter", periodCount: 4, chartStyle: "area", statuses: undefined, statusName: undefined, statusValue: attr(lineIx, r => STATUSES.find(l => r.newValue.includes(l.id)).name), statusOrder: "Open; In progress; Review; Done", legendPosition: "right" },
    { title: text("5. Columns side by side, last 6 months"), chartStyle: "columns", periodCount: 6 },
    { title: text("6. Style switcher (starts as stacked columns)"), name: "switcherDemo", showSwitcher: true, periodCount: 6 },
    { title: text("7. Options panel (browser saving)"), name: "optionsDemo", showSwitcher: true, showOptions: true, showExport: true, rememberChoices: true, periodCount: 6, wide: true },
    { title: text("8. Options panel, saved in a database attribute"), name: "dbDemo", showOptions: true, rememberChoices: true, saveIn: "attribute", choicesAttribute: db, onChoicesSaved: saved, periodCount: 6, wide: true }
];

const root = document.getElementById("root");
// ?only=7 renders just that variant (for the export test)
const only = Number(new URLSearchParams(location.search).get("only"));
variants.filter((_, i) => !only || i === only - 1).forEach(v => {
    const cell = document.createElement("div");
    cell.className = v.wide ? "cell wide" : "cell";
    root.appendChild(cell);
    createRoot(cell).render(h(StatusTimelineChart, { ...base, ...v }));
});
window.__changeRows = changeRows.length;

const params = new URLSearchParams(location.search);
// ?click=Columns clicks that switcher button after rendering, to test switching
const click = params.get("click");
if (click) {
    setTimeout(() => document.querySelector(`.stc-switch[title="${click}"]`)?.click(), 600);
}

// sets an input/select the way a user would, so React sees the change
function userSet(el, value) {
    const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
}
function demo(cellIndex) {
    const cell = document.querySelectorAll(".cell")[cellIndex];
    const field = label => [...cell.querySelectorAll(".stc-field")].find(f => f.firstChild.textContent === label);
    cell.querySelector('[title="Chart options"]').click();
    setTimeout(() => {
        userSet(field("Period").querySelector("select"), "week");
        userSet(field("Periods to show").querySelector("input"), "10");
        userSet(field("Title").querySelector("input"), "Changed by the user: last 10 weeks");
        userSet(field("Y axis title").querySelector("input"), "Tickets");
        userSet(field("Legend position").querySelector("select"), "top");
        [...field("What to count").querySelectorAll("input")][1].click();
    }, 300);
}
// ?open=1 opens the options panels (no changes); ?demo=1 also changes values like a user
if (params.get("open")) {
    const which = Number(params.get("open"));
    setTimeout(() => [...document.querySelectorAll('[title="Chart options"]')].forEach((b, i) => (which > 1 && i !== which - 1 ? null : b.click())), 400);
}
if (params.get("demo")) {
    setTimeout(() => demo(only ? 0 : 6), 400);
}


// ?probe=1 lists elements wider than the window (layout check for narrow screens)
if (params.get("probe")) {
    setTimeout(() => {
        const vw = root.getBoundingClientRect().right;
        const out = [...document.querySelectorAll(".cell *")]
            .filter(e => !e.closest(".stc-sr-only"))
            .map(e => [e, e.getBoundingClientRect()])
            .filter(([, r]) => r.right > vw + 1)
            .slice(0, 15)
            .map(([e, r]) => `${e.tagName}.${e.className} w=${Math.round(r.width)} right=${Math.round(r.right)}`);
        document.getElementById("db").textContent = `vw=${vw} ` + (out.join(" | ") || "nothing overflows");
    }, 1500);
}

// ?w=360 squeezes the page to that width (headless Edge cannot make the window narrower than ~490px)
if (params.get("w")) {
    root.style.width = params.get("w") + "px";
    root.style.gridTemplateColumns = "minmax(0, 1fr)";
}
