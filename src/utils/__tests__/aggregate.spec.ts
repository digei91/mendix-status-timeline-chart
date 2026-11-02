import { aggregate, ChangeRow, EMPTY_LANE, orderLanes, parseColorMap, resolveLane } from "../aggregate";
import { formatPeriod, startOfPeriod, weekNumber } from "../periods";

const d = (s: string): Date => new Date(s + "T12:00:00");

const rows: ChangeRow[] = [
    // ticket A: Open (Jan) -> In progress (Feb) -> Done (Mar)
    { ticket: "A", date: d("2026-01-10"), lane: "Open" },
    { ticket: "A", date: d("2026-02-03"), lane: "In progress" },
    { ticket: "A", date: d("2026-03-20"), lane: "Done" },
    // ticket B: Open (Jan) -> Done (Jan)
    { ticket: "B", date: d("2026-01-12"), lane: "Open" },
    { ticket: "B", date: d("2026-01-30"), lane: "Done" },
    // ticket C: Open (Feb), never moved
    { ticket: "C", date: d("2026-02-14"), lane: "Open" }
];

describe("aggregate snapshot", () => {
    it("counts each ticket once, in the lane of its latest change at period end", () => {
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

    it("skips rows without ticket id", () => {
        const r = aggregate([{ date: d("2026-01-01"), lane: "Open" }], {
            mode: "snapshot",
            unit: "month",
            periodCount: 0,
            endAt: "lastChange",
            weekStart: 1
        });
        expect(r.skippedNoTicket).toBe(1);
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
    it("counts changes into each lane per period", () => {
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

describe("resolveLane", () => {
    const ids = new Map([["281474976710657", "Open"]]);
    it("maps ids, also inside text", () => {
        expect(resolveLane("281474976710657", ids)).toBe("Open");
        expect(resolveLane("[281474976710657]", ids)).toBe("Open");
    });
    it("keeps names and marks empties", () => {
        expect(resolveLane(" Review ", ids)).toBe("Review");
        expect(resolveLane("", ids)).toBe(EMPTY_LANE);
        expect(resolveLane(undefined, ids)).toBe(EMPTY_LANE);
    });
});

describe("lane order and colors", () => {
    it("puts known lanes first, then preferred, then alphabetical", () => {
        expect(orderLanes(["b", "Done", "a"], [], ["done"])).toEqual(["Done", "a", "b"]);
        expect(orderLanes(["b", "a"], ["Z", "b"], [])).toEqual(["Z", "b", "a"]);
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
