export type PeriodUnit = "day" | "week" | "month" | "quarter" | "year";
/** Size of one column; "auto" picks finer columns for short ranges. */
export type ColumnUnit = PeriodUnit | "auto";

/** The next finer unit, used by Auto when a range would give too few columns. */
const FINER: Record<PeriodUnit, PeriodUnit> = { day: "day", week: "day", month: "day", quarter: "week", year: "month" };
/** Below this many columns Auto switches to the finer unit (1 year -> 12 months, 1 month -> ~30 days). */
const AUTO_MIN_COLUMNS = 4;

/**
 * Column size for a range of `count` x `rangeUnit`. Auto keeps one column per range unit when that gives enough
 * columns (so "last 6 months" stays 6 monthly columns) and goes one step finer for short ranges.
 */
export function resolveColumnUnit(rangeUnit: PeriodUnit, count: number, column: ColumnUnit): PeriodUnit {
    if (column !== "auto") {
        // a column bigger than the whole range (e.g. last 7 days per year) falls back to the range unit
        return columnFits(rangeUnit, count, column) ? column : rangeUnit;
    }
    return count > 0 && count < AUTO_MIN_COLUMNS ? FINER[rangeUnit] : rangeUnit;
}

/** Rough length in days, only used to compare sizes (3 months = 1 quarter, 12 months = 1 year, 365 days >= 1 year). */
const APPROX_DAYS: Record<PeriodUnit, number> = { day: 1, week: 7, month: 30, quarter: 90, year: 360 };

/** True when one column of this size is not bigger than the whole range; every size fits "all time" (count 0). */
export function columnFits(rangeUnit: PeriodUnit, count: number, column: ColumnUnit): boolean {
    return column === "auto" || count <= 0 || APPROX_DAYS[column] <= count * APPROX_DAYS[rangeUnit];
}

/** The unit that groups columns on the second axis line (days under their month, months under their year). */
export const GROUP_UNIT: Record<PeriodUnit, PeriodUnit | undefined> = {
    day: "month",
    week: "month",
    month: "year",
    quarter: "year",
    year: undefined
};

/** 1 = weeks start on Monday (ISO), 0 = weeks start on Sunday. */
export type WeekStart = 0 | 1;

/** Start (local midnight) of the period that contains `date`. */
export function startOfPeriod(date: Date, unit: PeriodUnit, weekStart: WeekStart): Date {
    const y = date.getFullYear();
    const m = date.getMonth();
    switch (unit) {
        case "day":
            return new Date(y, m, date.getDate());
        case "week": {
            const back = (date.getDay() - weekStart + 7) % 7;
            return new Date(y, m, date.getDate() - back);
        }
        case "month":
            return new Date(y, m, 1);
        case "quarter":
            return new Date(y, m - (m % 3), 1);
        case "year":
            return new Date(y, 0, 1);
    }
}

/** Moves a period start `n` periods forward (or back when negative). */
export function addPeriods(start: Date, unit: PeriodUnit, n: number): Date {
    const y = start.getFullYear();
    const m = start.getMonth();
    const d = start.getDate();
    switch (unit) {
        case "day":
            return new Date(y, m, d + n);
        case "week":
            return new Date(y, m, d + 7 * n);
        case "month":
            return new Date(y, m + n, 1);
        case "quarter":
            return new Date(y, m + 3 * n, 1);
        case "year":
            return new Date(y + n, 0, 1);
    }
}

/** Week number and the year it belongs to: ISO 8601 for Monday weeks, US style (week of 1 Jan = 1) for Sunday weeks. */
export function weekNumber(date: Date, weekStart: WeekStart): { week: number; year: number } {
    if (weekStart === 1) {
        // ISO: the week belongs to the year of its Thursday
        const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - ((date.getDay() + 6) % 7));
        const jan1 = new Date(thursday.getFullYear(), 0, 1);
        const week = Math.floor(dayDiff(jan1, thursday) / 7) + 1;
        return { week, year: thursday.getFullYear() };
    }
    const sunday = startOfPeriod(date, "week", 0);
    const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    if (saturday.getFullYear() !== sunday.getFullYear()) {
        // the week containing 1 January is week 1 of the new year
        return { week: 1, year: saturday.getFullYear() };
    }
    const jan1 = new Date(sunday.getFullYear(), 0, 1);
    return { week: Math.floor((dayDiff(jan1, sunday) + jan1.getDay()) / 7) + 1, year: sunday.getFullYear() };
}

function dayDiff(from: Date, to: Date): number {
    // Date.UTC avoids daylight-saving hour shifts
    return Math.round(
        (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
            Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
            86400000
    );
}

const DEFAULT_FORMATS: Record<PeriodUnit, string> = {
    day: "dd MMM yyyy",
    week: "'W'W yyyy",
    month: "MMM yyyy",
    quarter: "'Q'Q yyyy",
    year: "yyyy"
};

/** Short column labels when a second axis line shows the month or year (e.g. "5" under "November 2026"). */
export function shortFormat(column: PeriodUnit, rangeUnit: PeriodUnit): string {
    switch (column) {
        case "day":
            // a one-week range reads better with weekday names
            return rangeUnit === "week" ? "EEE d" : "d";
        case "week":
            return "'W'W";
        case "month":
            return "MMM";
        case "quarter":
            return "'Q'Q";
        case "year":
            return "yyyy";
    }
}

export const GROUP_FORMAT: Record<PeriodUnit, { long: string; short: string }> = {
    day: { long: "d MMM yyyy", short: "d MMM" },
    week: { long: "'W'W yyyy", short: "'W'W" },
    month: { long: "MMMM yyyy", short: "MMM yy" },
    quarter: { long: "'Q'Q yyyy", short: "'Q'Q" },
    year: { long: "yyyy", short: "yy" }
};

const TOKEN = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|EEEE|EEE|dd|d|W|Q/g;

/**
 * Formats a period start with tokens d, dd, M, MM, MMM, MMMM, EEE, EEEE (weekday), yy, yyyy, W, Q; text in single
 * quotes is literal.
 */
export function formatPeriod(
    start: Date,
    unit: PeriodUnit,
    format: string | undefined,
    locale: string | undefined,
    weekStart: WeekStart
): string {
    const pattern = format && format.trim() ? format : DEFAULT_FORMATS[unit];
    const week = unit === "week" ? weekNumber(start, weekStart) : undefined;
    // the ISO year of a week can differ from the calendar year (e.g. 29 Dec 2025 is W1 2026)
    const year = week ? week.year : start.getFullYear();
    return pattern.replace(TOKEN, token => {
        switch (token) {
            case "yyyy":
                return String(year);
            case "yy":
                return String(year).slice(-2);
            case "MMMM":
                return monthName(start, locale, "long");
            case "MMM":
                return monthName(start, locale, "short");
            case "EEEE":
                return weekdayName(start, locale, "long");
            case "EEE":
                return weekdayName(start, locale, "short");
            case "MM":
                return pad(start.getMonth() + 1);
            case "M":
                return String(start.getMonth() + 1);
            case "dd":
                return pad(start.getDate());
            case "d":
                return String(start.getDate());
            case "W":
                return String(week ? week.week : weekNumber(start, weekStart).week);
            case "Q":
                return String(Math.floor(start.getMonth() / 3) + 1);
            default:
                return token.slice(1, -1);
        }
    });
}

function pad(n: number): string {
    return n < 10 ? "0" + n : String(n);
}

function weekdayName(date: Date, locale: string | undefined, style: "short" | "long"): string {
    try {
        return new Intl.DateTimeFormat(locale, { weekday: style }).format(date);
    } catch {
        return new Intl.DateTimeFormat(undefined, { weekday: style }).format(date);
    }
}

function monthName(date: Date, locale: string | undefined, style: "short" | "long"): string {
    try {
        return new Intl.DateTimeFormat(locale, { month: style }).format(date);
    } catch {
        return new Intl.DateTimeFormat(undefined, { month: style }).format(date);
    }
}
