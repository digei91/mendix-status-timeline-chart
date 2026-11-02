import { ChangeEvent, ReactElement, ReactNode, useId } from "react";
import { ChartOptions, MAX_PERIOD_COUNT } from "../utils/choices";
import { STYLE_LABELS } from "./StyleSwitcher";
import { ChartStyle } from "./StatusChart";

export interface OptionsPanelProps {
    options: ChartOptions;
    /** Styles the user may pick; empty = no style field (the switcher already shows them, or switching is off). */
    styles: ChartStyle[];
    changed: boolean;
    onChange: (patch: Partial<ChartOptions>) => void;
    onReset: () => void;
    onClose: () => void;
}

const PERIOD_LABELS = { day: "Day", week: "Week", month: "Month", quarter: "Quarter", year: "Year" };
const LEGEND_LABELS = { top: "Top", bottom: "Bottom", left: "Left", right: "Right" };

function Field(props: { label: string; htmlFor?: string; children: ReactNode }): ReactElement {
    return (
        <div className="stc-field">
            {props.htmlFor ? <label htmlFor={props.htmlFor}>{props.label}</label> : <span>{props.label}</span>}
            {props.children}
        </div>
    );
}

/** Two or more choices as a segmented radio group. */
function Segmented<T extends string>(props: {
    name: string;
    label: string;
    value: T;
    choices: Array<[T, string]>;
    onChange: (value: T) => void;
}): ReactElement {
    return (
        <div className="stc-field">
            <span id={props.name + "-label"}>{props.label}</span>
            <div className="stc-segmented" role="radiogroup" aria-labelledby={props.name + "-label"}>
                {props.choices.map(([value, text]) => (
                    <label key={value} className={value === props.value ? "stc-seg stc-seg-active" : "stc-seg"}>
                        <input
                            type="radio"
                            name={props.name}
                            value={value}
                            checked={value === props.value}
                            onChange={() => props.onChange(value)}
                        />
                        {text}
                    </label>
                ))}
            </div>
        </div>
    );
}

/** Panel with every setting a user may change on the page. Values apply immediately. */
export function OptionsPanel({
    options,
    styles,
    changed,
    onChange,
    onReset,
    onClose
}: OptionsPanelProps): ReactElement {
    const id = useId();
    const textInput =
        (key: "title" | "xAxisTitle" | "yAxisTitle" | "dateFormat") =>
        (e: ChangeEvent<HTMLInputElement>): void =>
            onChange({ [key]: e.target.value });

    return (
        <div className="stc-options" role="region" aria-label="Chart options">
            <div className="stc-options-groups">
                <fieldset>
                    <legend>Counting</legend>
                    <Segmented
                        name={id + "mode"}
                        label="What to count"
                        value={options.mode}
                        choices={[
                            ["snapshot", "Snapshot at period end"],
                            ["moves", "Changes per period"]
                        ]}
                        onChange={mode => onChange({ mode })}
                    />
                    <div className="stc-row">
                        <Field label="Period" htmlFor={id + "period"}>
                            <select
                                id={id + "period"}
                                value={options.period}
                                onChange={e => onChange({ period: e.target.value as ChartOptions["period"] })}
                            >
                                {Object.entries(PERIOD_LABELS).map(([value, text]) => (
                                    <option key={value} value={value}>
                                        {text}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Periods to show" htmlFor={id + "count"}>
                            <input
                                id={id + "count"}
                                type="number"
                                min={0}
                                max={MAX_PERIOD_COUNT}
                                step={1}
                                value={options.periodCount}
                                title="0 shows everything from the first change on"
                                onChange={e => {
                                    const n = Math.round(Number(e.target.value));
                                    if (e.target.value !== "" && n >= 0 && n <= MAX_PERIOD_COUNT) {
                                        onChange({ periodCount: n });
                                    }
                                }}
                            />
                        </Field>
                    </div>
                    <Segmented
                        name={id + "end"}
                        label="Last period"
                        value={options.endAt}
                        choices={[
                            ["today", "Current period (today)"],
                            ["lastChange", "Period of the last change"]
                        ]}
                        onChange={endAt => onChange({ endAt })}
                    />
                </fieldset>
                <fieldset>
                    <legend>Texts</legend>
                    <Field label="Title" htmlFor={id + "title"}>
                        <input id={id + "title"} type="text" value={options.title} onChange={textInput("title")} />
                    </Field>
                    <div className="stc-row">
                        <Field label="X axis title" htmlFor={id + "x"}>
                            <input
                                id={id + "x"}
                                type="text"
                                value={options.xAxisTitle}
                                onChange={textInput("xAxisTitle")}
                            />
                        </Field>
                        <Field label="Y axis title" htmlFor={id + "y"}>
                            <input
                                id={id + "y"}
                                type="text"
                                value={options.yAxisTitle}
                                onChange={textInput("yAxisTitle")}
                            />
                        </Field>
                    </div>
                    <Field label="Date label format" htmlFor={id + "fmt"}>
                        <input
                            id={id + "fmt"}
                            type="text"
                            value={options.dateFormat}
                            placeholder="automatic, e.g. MMM yyyy or 'Week' W"
                            onChange={textInput("dateFormat")}
                        />
                    </Field>
                </fieldset>
                <fieldset>
                    <legend>Look</legend>
                    {styles.length > 1 ? (
                        <Field label="Chart style" htmlFor={id + "style"}>
                            <select
                                id={id + "style"}
                                value={options.chartStyle}
                                onChange={e => onChange({ chartStyle: e.target.value as ChartStyle })}
                            >
                                {styles.map(style => (
                                    <option key={style} value={style}>
                                        {STYLE_LABELS[style]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    ) : null}
                    <div className="stc-row">
                        <Field label="Legend" htmlFor={id + "legend"}>
                            <label className="stc-check">
                                <input
                                    id={id + "legend"}
                                    type="checkbox"
                                    checked={options.showLegend}
                                    onChange={e => onChange({ showLegend: e.target.checked })}
                                />
                                Show legend
                            </label>
                        </Field>
                        <Field label="Legend position" htmlFor={id + "pos"}>
                            <select
                                id={id + "pos"}
                                value={options.legendPosition}
                                disabled={!options.showLegend}
                                onChange={e =>
                                    onChange({ legendPosition: e.target.value as ChartOptions["legendPosition"] })
                                }
                            >
                                {Object.entries(LEGEND_LABELS).map(([value, text]) => (
                                    <option key={value} value={value}>
                                        {text}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </fieldset>
            </div>
            <div className="stc-options-actions">
                <button type="button" className="stc-btn" onClick={onReset} disabled={!changed}>
                    Reset to defaults
                </button>
                <button type="button" className="stc-btn stc-btn-primary" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
}
