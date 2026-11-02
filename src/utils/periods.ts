export type PeriodUnit = "day" | "week" | "month" | "quarter" | "year";

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
    day: "dd MMM",
    week: "'W'W yyyy",
    month: "MMM yyyy",
    quarter: "'Q'Q yyyy",
    year: "yyyy"
};

const TOKEN = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|dd|d|W|Q/g;

/** Formats a period start with tokens d, dd, M, MM, MMM, MMMM, yy, yyyy, W, Q; text in single quotes is literal. */
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

function monthName(date: Date, locale: string | undefined, style: "short" | "long"): string {
    try {
        return new Intl.DateTimeFormat(locale, { month: style }).format(date);
    } catch {
        return new Intl.DateTimeFormat(undefined, { month: style }).format(date);
    }
}
