import type { ChartStyle } from "../components/StatusChart";

export const ALL_STYLES: ChartStyle[] = ["bars", "columns", "area", "lines"];

/** Styles shown in the switcher, in fixed order; the start style is always one of them. */
export function offeredStyles(
    showSwitcher: boolean,
    startStyle: ChartStyle,
    offer: Record<ChartStyle, boolean>
): ChartStyle[] {
    if (!showSwitcher) {
        return [];
    }
    return ALL_STYLES.filter(style => offer[style] || style === startStyle);
}

/** The style a user picked earlier, if storage works and it is still offered. */
export function readStoredStyle(key: string, allowed: ChartStyle[]): ChartStyle | undefined {
    try {
        const stored = window.localStorage.getItem(key) as ChartStyle | null;
        return stored && allowed.includes(stored) ? stored : undefined;
    } catch {
        return undefined;
    }
}
