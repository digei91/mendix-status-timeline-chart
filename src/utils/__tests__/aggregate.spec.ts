import {
    aggregate,
    ChangeRow,
    EMPTY_STATUS,
    MAX_PERIODS,
    orderStatuses,
    parseColorMap,
    resolveStatus
} from "../aggregate";
import { columnFits, formatPeriod, resolveColumnUnit, shortFormat, startOfPeriod, weekNumber } from "../periods";

const d = (s: string): Date => new Date(s + "T12:00:00");

const rows: ChangeRow[] = [
    // item A: Open (Jan) -> In progress (Feb) -> Done (Mar)
    { item: "A", date: d("2026-01-10"), status: "Open" },
    { item: "A", date: d("2026-02-03"), status: "In progress" },
    { item: "A", date: d("2026-03-20"), status: "Done" },
    // item B: Open (Jan) -> Done (Jan)
    { item: "B", date: d("2026-01-12"), status: "Open" },
    { item: "B", date: d("2026-01-30"), status: "Done" },
    // item C: Open (Feb), never moved
    { item: "C", date: d("2026-02-14"), status: "Open" }
];

describe("aggregate snapshot", () => {
    it("counts each item once, in the status of its latest change at period end", () => {
        const r = aggregate(rows, {
            mode: "snapshot",
            unit: "month",
            periodCount: 3,
            endAt: "lastChange",
            weekStart: 1
        });
        expect(r.periods.map(p => p.getMonth())).toEqual([0, 1, 2]);
        expect(r.counts.get("Open")).toEqual([1, 1, 1]); // Jan: A; Feb: C; Mar: C
        expect(r.counts.get("In progress")).toEqual([0, 1, 0]);
        expect(r.counts.get("Done")).toEqual([1, 1, 2]);
    });

    it("applies changes from before the first shown period", () => {
        const r = aggregate(rows, {
            mode: "snapshot",
            unit: "month",
            periodCount: 1,
            endAt: "lastChange",
            weekStart: 1
        });
        expect(r.periods).toHaveLength(1);
        expect(r.counts.get("Open")).toEqual([1]);
        expect(r.counts.get("Done")).toEqual([2]);
        expect(r.counts.get("In progress")).toEqual([0]);
    });

    it("is independent of input order", () => {
        const shuffled = [...rows].reverse();
        const a = aggregate(rows, {
            mode: "snapshot",
            unit: "month",
            periodCount: 0,
            endAt: "lastChange",
            weekStart: 1
        });
        const b = aggregate(shuffled, {
            mode: "snapshot",
            unit: "month",
            periodCount: 0,
            endAt: "lastChange",
            weekStart: 1
        });
        expect([...b.counts.entries()]).toEqual(expect.arrayContaining([...a.counts.entries()]));
    });

    it("skips rows without item id", () => {
        const r = aggregate([{ date: d("2026-01-01"), status: "Open" }], {
            mode: "snapshot",
            unit: "month",
            periodCount: 0,
            endAt: "lastChange",
            weekStart: 1
        });
        expect(r.skippedNoItem).toBe(1);
    });

    it("ends with the current period when endAt = today", () => {
        const r = aggregate(rows, {
            mode: "snapshot",
            unit: "month",
            periodCount: 6,
            endAt: "today",
            weekStart: 1,
            now: d("2026-06-15")
        });
        expect(r.periods.map(p => p.getMonth())).toEqual([0, 1, 2, 3, 4, 5]);
        expect(r.counts.get("Done")).toEqual([1, 1, 2, 2, 2, 2]);
    });
});

describe("aggregate moves", () => {
    it("counts changes into each status per period", () => {
        const r = aggregate(rows, { mode: "moves", unit: "month", periodCount: 0, endAt: "lastChange", weekStart: 1 });
        expect(r.counts.get("Open")).toEqual([2, 1, 0]);
        expect(r.counts.get("In progress")).toEqual([0, 1, 0]);
        expect(r.counts.get("Done")).toEqual([1, 0, 1]);
    });

    it("leaves out changes outside the shown range", () => {
        const r = aggregate(rows, { mode: "moves", unit: "month", periodCount: 1, endAt: "lastChange", weekStart: 1 });
        expect(r.counts.get("Done")).toEqual([1]);
        expect(r.counts.has("Open")).toBe(false);
    });
});

describe("resolveStatus", () => {
    const ids = new Map([["281474976710657", "Open"]]);
    it("maps ids, also inside text", () => {
        expect(resolveStatus("281474976710657", ids)).toBe("Open");
        expect(resolveStatus("[281474976710657]", ids)).toBe("Open");
    });
    it("keeps names and marks empties", () => {
        expect(resolveStatus(" Review ", ids)).toBe("Review");
        expect(resolveStatus("", ids)).toBe(EMPTY_STATUS);
        expect(resolveStatus(undefined, ids)).toBe(EMPTY_STATUS);
    });
});

describe("status order and colors", () => {
    it("puts known statuses first, then preferred, then alphabetical", () => {
        expect(orderStatuses(["b", "Done", "a"], [], ["done"])).toEqual(["Done", "a", "b"]);
        expect(orderStatuses(["b", "a"], ["Z", "b"], [])).toEqual(["Z", "b", "a"]);
    });
    it("parses color settings", () => {
        const m = parseColorMap("Open=#E74C3C; In progress = #F39C12;bad");
        expect(m.get("open")).toBe("#E74C3C");
        expect(m.get("in progress")).toBe("#F39C12");
        expect(m.size).toBe(2);
    });
});

describe("periods", () => {
    it("starts weeks on Monday or Sunday", () => {
        const wed = d("2026-10-28");
        expect(startOfPeriod(wed, "week", 1).getDate()).toBe(26);
        expect(startOfPeriod(wed, "week", 0).getDate()).toBe(25);
    });
    it("uses ISO week numbers", () => {
        expect(weekNumber(d("2025-12-29"), 1)).toEqual({ week: 1, year: 2026 });
        expect(weekNumber(d("2026-10-26"), 1)).toEqual({ week: 44, year: 2026 });
        expect(weekNumber(d("2021-01-03"), 1)).toEqual({ week: 53, year: 2020 });
    });
    it("formats labels", () => {
        expect(formatPeriod(d("2026-03-01"), "month", "", "en-US", 1)).toBe("Mar 2026");
        expect(formatPeriod(d("2026-04-01"), "quarter", "", "en-US", 1)).toBe("Q2 2026");
        expect(formatPeriod(d("2025-12-29"), "week", "", "en-US", 1)).toBe("W1 2026");
        expect(formatPeriod(d("2026-03-05"), "day", "dd/MM/yy", "en-US", 1)).toBe("05/03/26");
        expect(formatPeriod(d("2026-03-05"), "week", "'Week' W", "en-US", 1)).toBe("Week 10");
    });
});

describe("time range with finer columns", () => {
    const now = new Date(2026, 10, 2, 12);

    it("Auto: short ranges get finer columns, longer ranges keep one column per range unit", () => {
        expect(resolveColumnUnit("year", 1, "auto")).toBe("month");
        expect(resolveColumnUnit("month", 1, "auto")).toBe("day");
        expect(resolveColumnUnit("quarter", 1, "auto")).toBe("week");
        expect(resolveColumnUnit("week", 2, "auto")).toBe("day");
        expect(resolveColumnUnit("month", 6, "auto")).toBe("month");
        expect(resolveColumnUnit("year", 0, "auto")).toBe("year");
        expect(resolveColumnUnit("year", 1, "quarter")).toBe("quarter");
    });

    it("last 1 year per month runs from January to the current month", () => {
        const r = aggregate(rows, {
            mode: "moves",
            unit: "month",
            rangeUnit: "year",
            periodCount: 1,
            endAt: "today",
            weekStart: 1,
            now
        });
        expect(r.periods).toHaveLength(11);
        expect(r.periods[0]).toEqual(new Date(2026, 0, 1));
        expect(r.counts.get("Open")?.slice(0, 2)).toEqual([2, 1]);
    });

    it("last 1 month per day has one column per day up to today", () => {
        const r = aggregate([], {
            mode: "moves",
            unit: "day",
            rangeUnit: "month",
            periodCount: 1,
            endAt: "today",
            weekStart: 1,
            now
        });
        expect(r.periods.map(p => p.getDate())).toEqual([1, 2]);
    });

    it("caps very long ranges and says so", () => {
        const r = aggregate([], {
            mode: "moves",
            unit: "day",
            rangeUnit: "year",
            periodCount: 3,
            endAt: "today",
            weekStart: 1,
            now
        });
        expect(r.periods).toHaveLength(MAX_PERIODS);
        expect(r.truncated).toBe(true);
    });

    it("short labels with weekday names", () => {
        expect(shortFormat("day", "week")).toBe("EEE d");
        expect(formatPeriod(new Date(2026, 10, 2), "day", "EEE d", "en-US", 1)).toBe("Mon 2");
        expect(formatPeriod(new Date(2026, 10, 2), "day", undefined, "en-US", 1)).toBe("02 Nov 2026");
    });

    it("never uses a column bigger than the range", () => {
        expect(columnFits("day", 7, "year")).toBe(false);
        expect(columnFits("week", 6, "month")).toBe(true);
        expect(columnFits("day", 0, "year")).toBe(true);
        expect(columnFits("month", 3, "quarter")).toBe(true);
        expect(columnFits("month", 12, "year")).toBe(true);
        expect(columnFits("month", 11, "year")).toBe(false);
        expect(resolveColumnUnit("day", 7, "year")).toBe("day");
        expect(resolveColumnUnit("week", 6, "month")).toBe("month");
    });

    it("moves: a first column that starts before the range counts only changes inside the range", () => {
        const changes: ChangeRow[] = [
            { item: "a", date: d("2026-09-02"), status: "Open" }, // before the 6-week range
            { item: "b", date: d("2026-09-28"), status: "Open" } // inside it
        ];
        const r = aggregate(changes, {
            mode: "moves",
            unit: "month",
            rangeUnit: "week",
            periodCount: 6,
            endAt: "today",
            weekStart: 1,
            now
        });
        expect(r.periods[0]).toEqual(new Date(2026, 8, 1));
        expect(r.counts.get("Open")).toEqual([1, 0, 0]);
    });
});
