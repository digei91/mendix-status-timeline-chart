import type { ChartStyle, LegendPosition } from "../components/StatusChart";
import type { CountMode } from "./aggregate";
import type { ColumnUnit, PeriodUnit } from "./periods";
import { ALL_STYLES } from "./styles";

export type EndAt = "today" | "lastChange";

/** Everything a user can change on the page. Studio Pro settings are the defaults. */
export interface ChartOptions {
    chartStyle: ChartStyle;
    mode: CountMode;
    period: PeriodUnit;
    periodCount: number;
    columnUnit: ColumnUnit;
    endAt: EndAt;
    title: string;
    xAxisTitle: string;
    yAxisTitle: string;
    dateFormat: string;
    showLegend: boolean;
    legendPosition: LegendPosition;
}

/** Only what the user changed; missing keys fall back to the Studio Pro value. */
export type UserChoices = Partial<ChartOptions>;

const MODES: CountMode[] = ["snapshot", "moves"];
const PERIODS: PeriodUnit[] = ["day", "week", "month", "quarter", "year"];
const COLUMN_UNITS: ColumnUnit[] = ["auto", ...PERIODS];
const END_AT: EndAt[] = ["today", "lastChange"];
const LEGEND_POSITIONS: LegendPosition[] = ["top", "bottom", "left", "right"];
export const MAX_PERIOD_COUNT = 1000;
const MAX_TEXT = 200;

const oneOf =
    <T extends string>(allowed: T[]) =>
    (v: unknown): T | undefined =>
        allowed.includes(v as T) ? (v as T) : undefined;
const text = (v: unknown): string | undefined => (typeof v === "string" ? v.slice(0, MAX_TEXT) : undefined);

const CHECKS: { [K in keyof ChartOptions]: (v: unknown) => ChartOptions[K] | undefined } = {
    chartStyle: oneOf(ALL_STYLES),
    mode: oneOf(MODES),
    period: oneOf(PERIODS),
    periodCount: v => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_PERIOD_COUNT ? v : undefined),
    columnUnit: oneOf(COLUMN_UNITS),
    endAt: oneOf(END_AT),
    title: text,
    xAxisTitle: text,
    yAxisTitle: text,
    dateFormat: text,
    showLegend: v => (typeof v === "boolean" ? v : undefined),
    legendPosition: oneOf(LEGEND_POSITIONS)
};

/** Keeps only known keys with valid values, so old or hand-edited data can never break the chart. */
export function sanitizeChoices(raw: unknown): UserChoices {
    const result: Record<string, unknown> = {};
    if (raw && typeof raw === "object") {
        for (const key of Object.keys(CHECKS) as Array<keyof ChartOptions>) {
            const value = CHECKS[key]((raw as Record<string, unknown>)[key]);
            if (value !== undefined) {
                result[key] = value;
            }
        }
    }
    return result as UserChoices;
}

export function mergeOptions(defaults: ChartOptions, choices: UserChoices): ChartOptions {
    return { ...defaults, ...choices };
}

/** Drops choices that equal the default, so later Studio Pro changes still reach users who never touched them. */
export function changedOnly(defaults: ChartOptions, choices: UserChoices): UserChoices {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(choices) as Array<keyof ChartOptions>) {
        if (choices[key] !== defaults[key]) {
            result[key] = choices[key];
        }
    }
    return result as UserChoices;
}

/**
 * The database attribute holds one JSON object for many widgets, keyed by widget name:
 * {"chart1": {"period": "week"}, "chart2": {...}}. Reads this widget's part.
 */
export function readFromJson(json: string | undefined, widgetName: string): UserChoices {
    try {
        const all = json ? JSON.parse(json) : undefined;
        return sanitizeChoices(all && typeof all === "object" ? all[widgetName] : undefined);
    } catch {
        return {};
    }
}

/** Writes this widget's part into the shared JSON, keeping other widgets' entries. */
export function writeToJson(json: string | undefined, widgetName: string, choices: UserChoices): string {
    let all: Record<string, unknown> = {};
    try {
        const parsed = json ? JSON.parse(json) : undefined;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            all = parsed;
        }
    } catch {
        // unreadable content is replaced
    }
    if (Object.keys(choices).length === 0) {
        delete all[widgetName];
    } else {
        all[widgetName] = choices;
    }
    return JSON.stringify(all);
}

export const storageKey = (widgetName: string): string => `stcChoices:${widgetName}`;

export function readFromBrowser(widgetName: string): UserChoices {
    try {
        const raw = window.localStorage.getItem(storageKey(widgetName));
        return raw ? sanitizeChoices(JSON.parse(raw)) : {};
    } catch {
        return {};
    }
}

export function writeToBrowser(widgetName: string, choices: UserChoices): void {
    try {
        if (Object.keys(choices).length === 0) {
            window.localStorage.removeItem(storageKey(widgetName));
        } else {
            window.localStorage.setItem(storageKey(widgetName), JSON.stringify(choices));
        }
    } catch {
        // storage blocked (private mode): choices just last until the page is left
    }
}
