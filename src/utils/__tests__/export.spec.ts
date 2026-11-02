import { buildCsv, exportedLine, exportFileName, isoDate, printHtml } from "../export";

const date = new Date(2026, 10, 2, 16, 5);
const series = [
    { name: "Open", color: "#000", data: [3, 1] },
    { name: 'In "progress"; now', color: "#111", data: [2, 0] }
];

describe("export helpers", () => {
    it("formats the exported line", () => {
        expect(isoDate(date)).toBe("2026-11-02");
        expect(exportedLine(date, "month", 6, "month", "snapshot")).toBe(
            "Exported 2026-11-02 16:05 · Last 6 months · per month · Snapshot at period end"
        );
        expect(exportedLine(date, "year", 1, "month", "moves")).toContain(
            "Last 1 year · per month · Changes per period"
        );
        expect(exportedLine(date, "year", 0, "year", "moves")).toContain("All time · per year");
    });

    it("builds safe file names", () => {
        expect(exportFileName("{title} - {date}", "Tickets per lane", date)).toBe("Tickets per lane - 2026-11-02");
        expect(exportFileName(undefined, "Open/Closed: Q1?", date)).toBe("Open-Closed- Q1- - 2026-11-02");
        expect(exportFileName("{title}", "  ", date)).toBe("Chart");
        expect(exportFileName("report_{date}", "x", date)).toBe("report_2026-11-02");
    });

    it("builds CSV for Excel with totals and quoting", () => {
        const csv = buildCsv(["Jan 2026", "Feb 2026"], series, "Exported now");
        expect(csv.startsWith("﻿")).toBe(true);
        expect(csv.slice(1).split("\r\n")).toEqual([
            "Exported now",
            "",
            'Period;Open;"In ""progress""; now";Total',
            "Jan 2026;3;2;5",
            "Feb 2026;1;0;1",
            ""
        ]);
        expect(buildCsv(["Jan"], [series[0]]).slice(1)).toBe("Period;Open;Total\r\nJan;3;3\r\n");
    });

    it("escapes text in the print page", () => {
        const html = printHtml("<b>T</b>", "blob:x", ["Jan"], series, "stamp & co");
        expect(html).toContain("&lt;b&gt;T&lt;/b&gt;");
        expect(html).toContain("stamp &amp; co");
        expect(html).toContain("<td>3</td><td>2</td><td>5</td>");
    });
});
