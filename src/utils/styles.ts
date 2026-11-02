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
