import { ReactElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

import { StatusTimelineChartContainerProps } from "../typings/StatusTimelineChartProps";
import { AxisGroup, ChartExporter, StatusChart, Series } from "./components/StatusChart";
import { ExportKind, ExportMenu } from "./components/ExportMenu";
import { usePopup } from "./components/usePopup";
import { OptionsPanel } from "./components/OptionsPanel";
import { StyleSwitcher } from "./components/StyleSwitcher";
import {
    changedOnly,
    ChartOptions,
    mergeOptions,
    readFromBrowser,
    readFromJson,
    UserChoices,
    writeToBrowser,
    writeToJson
} from "./utils/choices";
import {
    buildCsv,
    canCopyImage,
    copyImage,
    downloadBlob,
    exportedLine,
    exportFileName,
    printHtml,
    printInFrame
} from "./utils/export";
import { offeredStyles } from "./utils/styles";
import { aggregate, ChangeRow, orderStatuses, parseColorMap, resolveStatus, splitList } from "./utils/aggregate";
import { assignColors } from "./utils/colors";
import {
    formatPeriod,
    GROUP_FORMAT,
    GROUP_UNIT,
    resolveColumnUnit,
    shortFormat,
    startOfPeriod,
    WeekStart
} from "./utils/periods";

import "./ui/StatusTimelineChart.css";

/** Reads an attribute as text: enum captions, plain strings, numbers as digits. */
function readText(attr: ListAttributeValue<any> | undefined, item: ObjectItem): string | undefined {
    if (!attr) {
        return undefined;
    }
    const value = attr.get(item);
    if (value.value === undefined || value.value === null) {
        return undefined;
    }
    return typeof value.value === "string" ? value.displayValue || value.value : value.value.toString();
}

/** Locale of the Mendix session (e.g. en_US -> en-US), falling back to the browser. */
function sessionLocale(): string | undefined {
    try {
        const code = (window as any).mx?.session?.getConfig?.("locale")?.code as string | undefined;
        return code ? code.replace("_", "-") : document.documentElement.lang || navigator.language;
    } catch {
        return undefined;
    }
}

export function StatusTimelineChart(props: StatusTimelineChartContainerProps): ReactElement {
    const { changes, statuses } = props;
    const weekStart: WeekStart = props.weekStart === "sunday" ? 0 : 1;

    // styles users may pick: in the switcher, or in the options panel when there is no switcher
    const pickable = offeredStyles(props.showSwitcher || props.showOptions, props.chartStyle, {
        bars: props.offerBars,
        columns: props.offerColumns,
        area: props.offerArea,
        lines: props.offerLines
    });
    const switcherStyles = props.showSwitcher ? pickable : [];

    const defaults: ChartOptions = useMemo(
        () => ({
            chartStyle: props.chartStyle,
            mode: props.mode,
            period: props.period,
            periodCount: Math.max(0, props.periodCount),
            columnUnit: props.columnUnit,
            endAt: props.endAt,
            title: props.title?.value ?? "",
            xAxisTitle: props.xAxisTitle?.value ?? "",
            yAxisTitle: props.yAxisTitle?.value ?? "",
            dateFormat: props.dateFormat ?? "",
            showLegend: props.showLegend,
            legendPosition: props.legendPosition
        }),
        [
            props.chartStyle,
            props.mode,
            props.period,
            props.periodCount,
            props.columnUnit,
            props.endAt,
            props.title?.value,
            props.xAxisTitle?.value,
            props.yAxisTitle?.value,
            props.dateFormat,
            props.showLegend,
            props.legendPosition
        ]
    );

    const useDatabase = props.rememberChoices && props.saveIn === "attribute" && !!props.choicesAttribute;
    const [choices, setChoices] = useState<UserChoices>(() =>
        props.rememberChoices && !useDatabase ? readFromBrowser(props.name) : {}
    );
    const [panelOpen, setPanelOpen] = useState(false);
    const panelId = useId();
    const anchorRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const closePanel = useCallback(() => setPanelOpen(false), [setPanelOpen]);
    usePopup(panelOpen, closePanel, anchorRef, toggleRef);
    const [exportOpen, setExportOpen] = useState(false);
    const exporter = useRef<ChartExporter | null>(null);

    // database mode: read this widget's choices once the context object has loaded
    const loadedFromDatabase = useRef(false);
    const attrValue = props.choicesAttribute?.status === ValueStatus.Available ? props.choicesAttribute.value : null;
    useEffect(() => {
        if (useDatabase && !loadedFromDatabase.current && attrValue !== null) {
            loadedFromDatabase.current = true;
            setChoices(readFromJson(attrValue, props.name));
        }
    }, [useDatabase, attrValue, props.name]);

    // saving is debounced so typing a title does not write on every key press
    const latest = useRef(props);
    useEffect(() => {
        latest.current = props;
    });
    const saveTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(saveTimer.current), []);
    const persist = (next: UserChoices): void => {
        if (!props.rememberChoices) {
            return;
        }
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            const p = latest.current;
            const attr = p.choicesAttribute;
            if (!useDatabase) {
                writeToBrowser(p.name, next);
            } else if (attr && attr.status === ValueStatus.Available && !attr.readOnly) {
                attr.setValue(writeToJson(attr.value, p.name, next));
                if (p.onChoicesSaved?.canExecute) {
                    p.onChoicesSaved.execute();
                }
            }
        }, 500);
    };
    const updateChoices = (patch: UserChoices): void => {
        const next = changedOnly(defaults, { ...choices, ...patch });
        setChoices(next);
        persist(next);
    };
    const resetChoices = (): void => {
        setChoices({});
        persist({});
    };

    const merged = mergeOptions(defaults, choices);
    const options: ChartOptions = {
        ...merged,
        chartStyle: pickable.includes(merged.chartStyle) ? merged.chartStyle : defaults.chartStyle
    };
    const chartStyle = options.chartStyle;
    const columnUnit = resolveColumnUnit(options.period, options.periodCount, options.columnUnit);
    const { mode, period, periodCount, endAt } = options;

    const statusInfo = useMemo(() => {
        const idToName = new Map<string, string>();
        const known: string[] = [];
        const colorOf = new Map<string, string>();
        if (statuses?.status === ValueStatus.Available && statuses.items && props.statusName) {
            for (const item of statuses.items) {
                const name = readText(props.statusName, item);
                if (!name) {
                    continue;
                }
                idToName.set(String(item.id), name);
                known.push(name);
                const color = readText(props.statusColor, item);
                if (color) {
                    colorOf.set(name, color);
                }
            }
        }
        return { idToName, known, colorOf };
    }, [statuses, props.statusName, props.statusColor]);

    const result = useMemo(() => {
        if (changes.status !== ValueStatus.Available || !changes.items) {
            return undefined;
        }
        const rows: ChangeRow[] = [];
        for (const item of changes.items) {
            const date = props.changeDate.get(item).value;
            if (!date) {
                continue;
            }
            rows.push({
                date,
                status: resolveStatus(readText(props.statusValue, item), statusInfo.idToName),
                item: readText(props.itemId, item)
            });
        }
        return aggregate(rows, {
            mode,
            unit: columnUnit,
            rangeUnit: period,
            periodCount,
            endAt,
            weekStart
        });
    }, [
        changes,
        props.changeDate,
        props.statusValue,
        props.itemId,
        mode,
        period,
        periodCount,
        columnUnit,
        endAt,
        weekStart,
        statusInfo
    ]);

    const chart = useMemo(() => {
        if (!result) {
            return undefined;
        }
        const locale = sessionLocale();
        const format = (p: Date, pattern: string | undefined): string =>
            formatPeriod(p, columnUnit, pattern, locale, weekStart);
        const labels = result.periods.map(p => format(p, options.dateFormat));
        // automatic labels get two lines: short ones per column ("5") and the month or year once below them
        const groupUnit = options.dateFormat.trim() ? undefined : GROUP_UNIT[columnUnit];
        let tickLabels: string[] | undefined;
        const groups: AxisGroup[] = [];
        if (groupUnit) {
            tickLabels = result.periods.map(p => format(p, shortFormat(columnUnit, options.period)));
            result.periods.forEach((p, i) => {
                const start = startOfPeriod(p, groupUnit, weekStart);
                const last = groups[groups.length - 1];
                if (last && last.key === start.getTime()) {
                    last.to = i;
                } else {
                    const fmt = GROUP_FORMAT[groupUnit];
                    groups.push({
                        key: start.getTime(),
                        label: formatPeriod(start, groupUnit, fmt.long, locale, weekStart),
                        short: formatPeriod(start, groupUnit, fmt.short, locale, weekStart),
                        from: i,
                        to: i
                    });
                }
            });
        }
        const ordered = orderStatuses([...result.counts.keys()], statusInfo.known, splitList(props.statusOrder));
        const colors = assignColors(ordered, statusInfo.colorOf, parseColorMap(props.statusColors));
        const hidden = new Set(splitList(props.hiddenStatuses).map(l => l.toLowerCase()));
        const series: Series[] = ordered
            .filter(status => !hidden.has(status.toLowerCase()))
            .map(status => ({
                name: status,
                color: colors.get(status)!,
                data: result.counts.get(status) ?? new Array(labels.length).fill(0)
            }));
        return { labels, tickLabels, groups: groupUnit ? groups : undefined, series, truncated: result.truncated };
    }, [
        result,
        columnUnit,
        options.period,
        options.dateFormat,
        props.statusOrder,
        props.statusColors,
        props.hiddenStatuses,
        statusInfo,
        weekStart
    ]);

    const title = options.title;

    const exportKinds: ExportKind[] = props.showExport
        ? (
              [
                  ["image", props.exportImage],
                  ["copy", props.exportCopy],
                  ["csv", props.exportCsv],
                  ["pdf", props.exportPdf]
              ] as Array<[ExportKind, boolean]>
          )
              .filter(([, on]) => on)
              .map(([kind]) => kind)
        : [];

    /** Exports exactly what is on screen: current options and only the statuses visible in the legend. */
    const runExport = async (kind: ExportKind): Promise<string | undefined> => {
        const handle = exporter.current;
        if (!chart || !handle) {
            return undefined;
        }
        const now = new Date();
        const stamp = props.exportStamp
            ? exportedLine(now, options.period, options.periodCount, columnUnit, options.mode)
            : undefined;
        const name = exportFileName(props.exportFileName, title || "Chart", now);
        const visible = new Set(handle.visibleNames());
        const series = chart.series.filter(s => visible.has(s.name));
        const png = (): Promise<Blob> => handle.toPng({ title, footer: stamp });

        if (kind === "csv") {
            downloadBlob(
                new Blob([buildCsv(chart.labels, series, stamp)], { type: "text/csv;charset=utf-8" }),
                name + ".csv"
            );
            return undefined;
        }
        if (kind === "image") {
            downloadBlob(await png(), name + ".png");
            return undefined;
        }
        if (kind === "copy") {
            if (!canCopyImage()) {
                return "Copying images is not possible here. Use Download image instead.";
            }
            await copyImage(png());
            return "Image copied. Paste it with Ctrl+V.";
        }
        const url = URL.createObjectURL(await png());
        // the picture already carries the "Exported" line, so the print page does not repeat it
        printInFrame(printHtml(name, url, chart.labels, series), () => URL.revokeObjectURL(url));
        return undefined;
    };
    const missingItemId = options.mode === "snapshot" && !props.itemId;
    const noData = chart && chart.series.every(s => s.data.every(v => v === 0));

    return (
        <div
            className={["widget-status-timeline-chart", panelOpen || exportOpen ? "stc-open" : "", props.class]
                .join(" ")
                .trim()}
            style={props.style}
        >
            {title || switcherStyles.length > 1 || props.showOptions || exportKinds.length > 0 ? (
                <div className="stc-header">
                    {title ? <div className="stc-title">{title}</div> : <span />}
                    <div className="stc-tools">
                        {switcherStyles.length > 1 ? (
                            <StyleSwitcher
                                styles={switcherStyles}
                                active={chartStyle}
                                onChange={style => updateChoices({ chartStyle: style })}
                            />
                        ) : null}
                        {exportKinds.length > 0 ? (
                            <ExportMenu
                                kinds={exportKinds}
                                disabled={!chart}
                                onExport={runExport}
                                open={exportOpen}
                                setOpen={setExportOpen}
                            />
                        ) : null}
                        {props.showOptions ? (
                            <div className="stc-options-anchor" ref={anchorRef}>
                                <button
                                    ref={toggleRef}
                                    type="button"
                                    className={
                                        "stc-switch stc-options-toggle" + (panelOpen ? " stc-switch-active" : "")
                                    }
                                    aria-expanded={panelOpen}
                                    aria-controls={panelId}
                                    title="Chart options"
                                    onClick={() => setPanelOpen(!panelOpen)}
                                >
                                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                                        <path
                                            fill="currentColor"
                                            fillRule="evenodd"
                                            d="M6.6 1h2.8l.4 1.9 1.3.7 1.8-.7 1.4 2.4-1.5 1.3v1.5l1.5 1.3-1.4 2.4-1.8-.7-1.3.7-.4 1.9H6.6l-.4-1.9-1.3-.7-1.8.7-1.4-2.4 1.5-1.3V6.6L1.7 5.3l1.4-2.4 1.8.7 1.3-.7zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
                                        />
                                    </svg>
                                    <span className="stc-switch-label">Options</span>
                                </button>
                                {panelOpen ? (
                                    <div id={panelId} className="stc-popup">
                                        <OptionsPanel
                                            options={options}
                                            styles={pickable}
                                            changed={Object.keys(choices).length > 0}
                                            onChange={updateChoices}
                                            onReset={resetChoices}
                                            onClose={() => {
                                                setPanelOpen(false);
                                                toggleRef.current?.focus();
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {chart?.truncated ? (
                <div className="stc-message stc-message-error">
                    Too many columns for this range: only the newest are shown. Choose larger columns or a shorter
                    range.
                </div>
            ) : null}
            {missingItemId ? (
                <div className="stc-message stc-message-error">
                    &quot;Snapshot at period end&quot; needs the Item ID setting (Data tab) to know which changes belong
                    to the same item.
                </div>
            ) : null}
            {!chart ? (
                <div className="stc-message" style={{ height: props.height }}>
                    Loading…
                </div>
            ) : (
                <div className="stc-body">
                    <StatusChart
                        labels={chart.labels}
                        tickLabels={chart.tickLabels}
                        groups={chart.groups}
                        series={chart.series}
                        chartStyle={chartStyle}
                        height={props.height}
                        showTotal={props.showTotal}
                        showGrid={props.showGrid}
                        showLegend={options.showLegend}
                        legendPosition={options.legendPosition}
                        xAxisTitle={options.xAxisTitle}
                        yAxisTitle={options.yAxisTitle}
                        exporter={exporter}
                    />
                    {noData ? <div className="stc-overlay">No status changes in this period range.</div> : null}
                    <div className="stc-sr-only">
                        <table>
                            <caption>{title || "Items per status"}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Period</th>
                                    {chart.series.map(s => (
                                        <th scope="col" key={s.name}>
                                            {s.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chart.labels.map((label, i) => (
                                    <tr key={label + i}>
                                        <th scope="row">{label}</th>
                                        {chart.series.map(s => (
                                            <td key={s.name}>{s.data[i]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
