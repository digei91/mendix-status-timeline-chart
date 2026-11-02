import { addPeriods, PeriodUnit, startOfPeriod, WeekStart } from "./periods";

export const EMPTY_STATUS = "(empty)";
/** Safety cap on columns, so "last 3 years per day" stays fast and readable; the newest columns are kept. */
export const MAX_PERIODS = 400;

export interface ChangeRow {
    date: Date;
    status: string;
    item?: string;
}

export type CountMode = "snapshot" | "moves";

export interface AggregateOptions {
    mode: CountMode;
    /** Size of one column. */
    unit: PeriodUnit;
    /** Unit of the time range; defaults to `unit` (one column per range unit). */
    rangeUnit?: PeriodUnit;
    /** Length of the time range in range units, back from the last one; 0 = from the first change on. */
    periodCount: number;
    endAt: "today" | "lastChange";
    weekStart: WeekStart;
    now?: Date;
}

export interface AggregateResult {
    /** Start date of every period, oldest first. */
    periods: Date[];
    /** Count per status, one number per period. Contains every status seen in the data. */
    counts: Map<string, number[]>;
    /** True when the range needed more than MAX_PERIODS columns and only the newest were kept. */
    truncated?: boolean;
    /** Snapshot rows skipped because they had no item id. */
    skippedNoItem: number;
}

/**
 * Counts changes per status per period.
 * snapshot: per period end, every item counts once in the status of its latest change up to then.
 * moves: every change counts once in the period it happened, under the status it moved into.
 */
export function aggregate(rows: ChangeRow[], options: AggregateOptions): AggregateResult {
    const { mode, unit, weekStart } = options;
    const counts = new Map<string, number[]>();
    const sorted = rows.filter(r => !isNaN(r.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sorted.length === 0 && options.endAt === "lastChange") {
        return { periods: [], counts, skippedNoItem: 0 };
    }

    const lastDate =
        options.endAt === "today" || sorted.length === 0 ? options.now ?? new Date() : sorted[sorted.length - 1].date;
    const rangeUnit = options.rangeUnit ?? unit;
    const last = startOfPeriod(lastDate, unit, weekStart);
    // the range starts at the beginning of the earliest range unit, e.g. 1 January for "last 1 year"
    const rangeStart =
        options.periodCount > 0 || sorted.length === 0
            ? addPeriods(
                  startOfPeriod(lastDate, rangeUnit, weekStart),
                  rangeUnit,
                  -(Math.max(options.periodCount, 1) - 1)
              )
            : sorted[0].date;
    let first = startOfPeriod(rangeStart, unit, weekStart);
    if (first > last) {
        first = last;
    }
    const earliest = addPeriods(last, unit, -(MAX_PERIODS - 1));
    const truncated = first < earliest;
    if (truncated) {
        first = earliest;
    }

    const periods: Date[] = [];
    for (let p = first; p <= last; p = addPeriods(p, unit, 1)) {
        periods.push(p);
    }
    const series = (status: string): number[] => {
        let s = counts.get(status);
        if (!s) {
            s = new Array(periods.length).fill(0);
            counts.set(status, s);
        }
        return s;
    };

    if (mode === "moves") {
        const index = new Map(periods.map((p, i) => [p.getTime(), i]));
        for (const row of sorted) {
            const i = index.get(startOfPeriod(row.date, unit, weekStart).getTime());
            if (i !== undefined) {
                series(row.status)[i]++;
            }
        }
        return { periods, counts, truncated, skippedNoItem: 0 };
    }

    const statusOfItem = new Map<string, string>();
    const current = new Map<string, number>();
    let skippedNoItem = 0;
    let next = 0;
    periods.forEach((period, i) => {
        const end = addPeriods(period, unit, 1).getTime();
        while (next < sorted.length && sorted[next].date.getTime() < end) {
            const row = sorted[next++];
            if (row.item === undefined || row.item === "") {
                skippedNoItem++;
                continue;
            }
            const previous = statusOfItem.get(row.item);
            if (previous !== undefined) {
                current.set(previous, (current.get(previous) ?? 0) - 1);
            }
            statusOfItem.set(row.item, row.status);
            current.set(row.status, (current.get(row.status) ?? 0) + 1);
            series(row.status);
        }
        current.forEach((n, status) => {
            series(status)[i] = n;
        });
    });
    return { periods, counts, truncated, skippedNoItem };
}

/** Turns a raw "new value" into a status name, mapping object ids (also inside text like "[123]") to names. */
export function resolveStatus(raw: string | undefined, idToName: Map<string, string>): string {
    const value = (raw ?? "").trim();
    if (value === "") {
        return EMPTY_STATUS;
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

/** Parses "Open=#E74C3C; Done=#27AE60" into a map keyed by lower-case status name. */
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
 * Final status order: statuses from the Statuses list (in its order), then the "Status order" setting, then the rest
 * alphabetically. Hidden statuses are dropped afterwards, so colors stay the same when statuses are hidden.
 */
export function orderStatuses(found: string[], known: string[], preferred: string[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    const add = (status: string): void => {
        if (!seen.has(status)) {
            seen.add(status);
            result.push(status);
        }
    };
    known.forEach(add);
    const foundSet = new Set(found);
    // preferred names match case-insensitively against what is in the data
    const byLower = new Map(found.map(l => [l.toLowerCase(), l]));
    preferred.forEach(p => add(byLower.get(p.toLowerCase()) ?? p));
    [...foundSet].sort((a, b) => a.localeCompare(b)).forEach(add);
    // a preferred name that is not in the data and not a known status adds nothing useful
    return result.filter(l => foundSet.has(l) || known.includes(l));
}
