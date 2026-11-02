// Browser test page: renders the built widget with mocked Mendix props (AuditLogging-style LogLines).
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { TicketStatusChart } from "../../dist/tmp/widgets/digei/ticketstatuschart/TicketStatusChart.mjs";

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const LANES = [
    { id: "281474976710657", name: "Open" },
    { id: "281474976710658", name: "In progress" },
    { id: "281474976710659", name: "Review" },
    { id: "281474976710660", name: "Done" }
];

// 140 tickets created over the last 12 months, each walking Open -> In progress -> Review -> Done (sometimes back)
const logLines = [];
const now = new Date(2026, 9, 30);
for (let t = 1; t <= 140; t++) {
    let date = new Date(now.getTime() - rand() * 365 * 86400000);
    let lane = 0;
    logLines.push({ id: "L" + logLines.length, ticket: "T" + t, date, newValue: LANES[0].id });
    while (lane < 3) {
        date = new Date(date.getTime() + (2 + rand() * 40) * 86400000);
        if (date > now) break;
        lane = rand() < 0.12 && lane > 0 ? lane - 1 : lane + 1;
        logLines.push({ id: "L" + logLines.length, ticket: "T" + t, date, newValue: "[" + LANES[lane].id + "]" });
    }
}

const list = items => ({ status: "available", items: items.map(i => ({ id: i.id })), _src: items });
const byId = src => new Map(src.map(s => [s.id, s]));
const changes = list(logLines);
const lanes = list(LANES);
const lineIx = byId(logLines);
const laneIx = byId(LANES);
const attr = (ix, f) => ({ get: item => { const v = f(ix.get(item.id)); return { value: v, displayValue: v == null ? "" : String(v) }; } });
const text = v => ({ status: "available", value: v });

const base = {
    name: "chart", class: "", changes,
    changeDate: attr(lineIx, r => r.date),
    laneValue: attr(lineIx, r => r.newValue),
    ticketId: attr(lineIx, r => r.ticket),
    lanes, laneName: attr(laneIx, l => l.name), laneColor: undefined,
    mode: "snapshot", period: "month", periodCount: 12, endAt: "today", weekStart: "monday",
    chartStyle: "bars", height: 300, showTotal: true, showGrid: true,
    laneColors: "", hiddenLanes: "", laneOrder: "", dateFormat: "",
    showLegend: true, legendPosition: "bottom",
    yAxisTitle: text("Tickets")
};

const variants = [
    { title: text("1. Snapshot per month, stacked bars (default settings)") },
    { title: text("2. Snapshot, Done hidden, custom colors"), hiddenLanes: "Done", laneColors: "Open=#E74C3C; In progress=#F39C12; Review=#8E44AD" },
    { title: text("3. Moves per week, lines + total, last 16 weeks"), mode: "moves", period: "week", periodCount: 16, chartStyle: "lines", legendPosition: "top" },
    { title: text("4. Snapshot per quarter, stacked area, no Lanes list"), period: "quarter", periodCount: 4, chartStyle: "area", lanes: undefined, laneName: undefined, laneValue: attr(lineIx, r => LANES.find(l => r.newValue.includes(l.id)).name), laneOrder: "Open; In progress; Review; Done", legendPosition: "right" }
];

const root = document.getElementById("root");
variants.forEach(v => {
    const cell = document.createElement("div");
    cell.className = "cell";
    root.appendChild(cell);
    createRoot(cell).render(h(TicketStatusChart, { ...base, ...v }));
});
window.__logLines = logLines.length;

