import { addPeriods, PeriodUnit, startOfPeriod, WeekStart } from "./periods";

export const EMPTY_LANE = "(empty)";
/** Safety cap so "show everything" with Period = Day over many years stays fast. */
export const MAX_PERIODS = 1000;

export interface ChangeRow {
    date: Date;
    lane: string;
    ticket?: string;
}

export type CountMode = "snapshot" | "moves";

export interface AggregateOptions {
    mode: CountMode;
    unit: PeriodUnit;
    /** Number of periods back from the last one; 0 = from the first change on. */
    periodCount: number;
    endAt: "today" | "lastChange";
    weekStart: WeekStart;
    now?: Date;
}

export interface AggregateResult {
    /** Start date of every period, oldest first. */
    periods: Date[];
    /** Count per lane, one number per period. Contains every lane seen in the data. */
    counts: Map<string, number[]>;
    /** Snapshot rows skipped because they had no ticket id. */
    skippedNoTicket: number;
}

/**
 * Counts changes per lane per period.
 * snapshot: per period end, every ticket counts once in the lane of its latest change up to then.
 * moves: every change counts once in the period it happened, under the lane it moved into.
 */
export function aggregate(rows: ChangeRow[], options: AggregateOptions): AggregateResult {
    const { mode, unit, weekStart } = options;
    const counts = new Map<string, number[]>();
    const sorted = rows.filter(r => !isNaN(r.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sorted.length === 0 && options.endAt === "lastChange") {
        return { periods: [], counts, skippedNoTicket: 0 };
    }

    const lastDate =
        options.endAt === "today" || sorted.length === 0 ? options.now ?? new Date() : sorted[sorted.length - 1].date;
    const last = startOfPeriod(lastDate, unit, weekStart);
    let first =
        options.periodCount > 0 || sorted.length === 0
            ? addPeriods(last, unit, -(Math.max(options.periodCount, 1) - 1))
            : startOfPeriod(sorted[0].date, unit, weekStart);
    if (first > last) {
        first = last;
    }
    const earliest = addPeriods(last, unit, -(MAX_PERIODS - 1));
    if (first < earliest) {
        first = earliest;
    }

    const periods: Date[] = [];
    for (let p = first; p <= last; p = addPeriods(p, unit, 1)) {
        periods.push(p);
    }
    const series = (lane: string): number[] => {
        let s = counts.get(lane);
        if (!s) {
            s = new Array(periods.length).fill(0);
            counts.set(lane, s);
        }
        return s;
    };

    if (mode === "moves") {
        const index = new Map(periods.map((p, i) => [p.getTime(), i]));
        for (const row of sorted) {
            const i = index.get(startOfPeriod(row.date, unit, weekStart).getTime());
            if (i !== undefined) {
                series(row.lane)[i]++;
            }
        }
        return { periods, counts, skippedNoTicket: 0 };
    }

    const laneOfTicket = new Map<string, string>();
    const current = new Map<string, number>();
    let skippedNoTicket = 0;
    let next = 0;
    periods.forEach((period, i) => {
        const end = addPeriods(period, unit, 1).getTime();
        while (next < sorted.length && sorted[next].date.getTime() < end) {
            const row = sorted[next++];
            if (row.ticket === undefined || row.ticket === "") {
                skippedNoTicket++;
                continue;
            }
            const previous = laneOfTicket.get(row.ticket);
            if (previous !== undefined) {
                current.set(previous, (current.get(previous) ?? 0) - 1);
            }
            laneOfTicket.set(row.ticket, row.lane);
            current.set(row.lane, (current.get(row.lane) ?? 0) + 1);
            series(row.lane);
        }
        current.forEach((n, lane) => {
            series(lane)[i] = n;
        });
    });
    return { periods, counts, skippedNoTicket };
}

/** Turns a raw "new value" into a lane name, mapping object ids (also inside text like "[123]") to names. */
export function resolveLane(raw: string | undefined, idToName: Map<string, string>): string {
    const value = (raw ?? "").trim();
    if (value === "") {
        return EMPTY_LANE;
    }
    const direct = idToName.get(value);
    if (direct !== undefined) {
        return direct;
    }
    for (const id of value.match(/\d{5,}/g) ?? []) {
        const name = idToName.get(id);
        if (name !== undefined) {
            return name;
        }
    }
    return value;
}

/** Splits "a; b; c" into trimmed, non-empty parts. */
export function splitList(text: string | undefined): string[] {
    return (text ?? "")
        .split(";")
        .map(s => s.trim())
        .filter(s => s !== "");
}

/** Parses "Open=#E74C3C; Done=#27AE60" into a map keyed by lower-case lane name. */
export function parseColorMap(text: string | undefined): Map<string, string> {
    const map = new Map<string, string>();
    for (const part of splitList(text)) {
        const eq = part.lastIndexOf("=");
        if (eq > 0) {
            map.set(part.slice(0, eq).trim().toLowerCase(), part.slice(eq + 1).trim());
        }
    }
    return map;
}

/**
 * Final lane order: lanes from the Lanes list (in its order), then the "Lane order" setting, then the rest
 * alphabetically. Hidden lanes are dropped afterwards, so colors stay the same when lanes are hidden.
 */
export function orderLanes(found: string[], known: string[], preferred: string[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    const add = (lane: string): void => {
        if (!seen.has(lane)) {
            seen.add(lane);
            result.push(lane);
        }
    };
    known.forEach(add);
    const foundSet = new Set(found);
    // preferred names match case-insensitively against what is in the data
    const byLower = new Map(found.map(l => [l.toLowerCase(), l]));
    preferred.forEach(p => add(byLower.get(p.toLowerCase()) ?? p));
    [...foundSet].sort((a, b) => a.localeCompare(b)).forEach(add);
    // a preferred name that is not in the data and not a known lane adds nothing useful
    return result.filter(l => foundSet.has(l) || known.includes(l));
}
