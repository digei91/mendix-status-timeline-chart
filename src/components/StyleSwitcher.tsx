import { ReactElement } from "react";
import { ChartStyle } from "./StatusChart";

export const STYLE_LABELS: Record<ChartStyle, string> = {
    bars: "Stacked columns",
    columns: "Columns",
    area: "Stacked area",
    lines: "Lines"
};

/** 16x16 outline icons, drawn in currentColor so they follow the button state. */
const ICONS: Record<ChartStyle, ReactElement> = {
    bars: (
        <g>
            <rect x="2" y="8" width="3" height="6" />
            <rect x="2" y="4" width="3" height="4" opacity="0.5" />
            <rect x="6.5" y="6" width="3" height="8" />
            <rect x="6.5" y="2" width="3" height="4" opacity="0.5" />
            <rect x="11" y="9" width="3" height="5" />
            <rect x="11" y="5" width="3" height="4" opacity="0.5" />
        </g>
    ),
    columns: (
        <g>
            <rect x="1.5" y="6" width="2.5" height="8" />
            <rect x="4.5" y="9" width="2.5" height="5" opacity="0.5" />
            <rect x="9" y="3" width="2.5" height="11" />
            <rect x="12" y="7" width="2.5" height="7" opacity="0.5" />
        </g>
    ),
    area: (
        <g>
            <path d="M1 14 L1 9 L5 7 L9 8 L15 4 L15 14 Z" opacity="0.5" />
            <path d="M1 14 L1 11 L5 10 L9 11 L15 8 L15 14 Z" />
        </g>
    ),
    lines: (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
            <polyline points="1.5,12 5,8 9,10 14.5,4" />
            <polyline points="1.5,6 5,9 9,6 14.5,11" opacity="0.5" />
        </g>
    )
};

export interface StyleSwitcherProps {
    styles: ChartStyle[];
    active: ChartStyle;
    onChange: (style: ChartStyle) => void;
}

/** Segmented button row to pick the chart style on the page. */
export function StyleSwitcher({ styles, active, onChange }: StyleSwitcherProps): ReactElement {
    return (
        <div className="stc-switcher" role="group" aria-label="Chart style">
            {styles.map(style => (
                <button
                    key={style}
                    type="button"
                    className={style === active ? "stc-switch stc-switch-active" : "stc-switch"}
                    aria-pressed={style === active}
                    title={STYLE_LABELS[style]}
                    onClick={() => onChange(style)}
                >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                        {ICONS[style]}
                    </svg>
                    <span className="stc-switch-label">{STYLE_LABELS[style]}</span>
                </button>
            ))}
        </div>
    );
}
