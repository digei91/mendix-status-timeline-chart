/** Categorical palette in fixed order (validated for color-blind separation of neighbours). */
export const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
/** Statuses past the eighth get neutral greys instead of generated hues. */
const OVERFLOW = ["#8a8985", "#b0afa9", "#6b6a66", "#c9c8c2"];

export const TEXT_PRIMARY = "#0b0b0b";
export const TEXT_SECONDARY = "#52514e";
export const GRID = "#e4e3df";
export const SURFACE = "#ffffff";

/** Color per status: status-object color, then the "Status colors" setting, then the palette by position. */
export function assignColors(
    orderedStatuses: string[],
    fromStatusObjects: Map<string, string>,
    fromSetting: Map<string, string>
): Map<string, string> {
    const result = new Map<string, string>();
    let paletteIndex = 0;
    for (const status of orderedStatuses) {
        const fixed = fromStatusObjects.get(status) || fromSetting.get(status.toLowerCase());
        if (fixed) {
            result.set(status, fixed);
            continue;
        }
        const i = paletteIndex++;
        result.set(status, i < PALETTE.length ? PALETTE[i] : OVERFLOW[(i - PALETTE.length) % OVERFLOW.length]);
    }
    return result;
}

/** Same color with transparency, for filled areas. Accepts #rgb / #rrggbb; other CSS colors are returned as-is. */
export function withAlpha(color: string, alpha: number): string {
    const hex = color.trim().replace("#", "");
    const full = hex.length === 3 ? hex.replace(/./g, c => c + c) : hex;
    if (!/^[0-9a-f]{6}$/i.test(full)) {
        return color;
    }
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
