import { ReactElement, useMemo } from "react";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

import { StatusTimelineChartContainerProps } from "../typings/StatusTimelineChartProps";
import { StatusChart, Series } from "./components/StatusChart";
import { aggregate, ChangeRow, orderStatuses, parseColorMap, resolveStatus, splitList } from "./utils/aggregate";
import { assignColors } from "./utils/colors";
import { formatPeriod, WeekStart } from "./utils/periods";

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
            mode: props.mode,
            unit: props.period,
            periodCount: Math.max(0, props.periodCount),
            endAt: props.endAt,
            weekStart
        });
    }, [
        changes,
        props.changeDate,
        props.statusValue,
        props.itemId,
        props.mode,
        props.period,
        props.periodCount,
        props.endAt,
        weekStart,
        statusInfo
    ]);

    const chart = useMemo(() => {
        if (!result) {
            return undefined;
        }
        const locale = sessionLocale();
        const labels = result.periods.map(p => formatPeriod(p, props.period, props.dateFormat, locale, weekStart));
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
        return { labels, series };
    }, [
        result,
        props.period,
        props.dateFormat,
        props.statusOrder,
        props.statusColors,
        props.hiddenStatuses,
        statusInfo,
        weekStart
    ]);

    const title = props.title?.value;
    const missingItemId = props.mode === "snapshot" && !props.itemId;
    const noData = chart && chart.series.every(s => s.data.every(v => v === 0));

    return (
        <div className={["widget-status-timeline-chart", props.class].join(" ").trim()} style={props.style}>
            {title ? <div className="stc-title">{title}</div> : null}
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
                        series={chart.series}
                        chartStyle={props.chartStyle}
                        height={props.height}
                        showTotal={props.showTotal}
                        showGrid={props.showGrid}
                        showLegend={props.showLegend}
                        legendPosition={props.legendPosition}
                        xAxisTitle={props.xAxisTitle?.value}
                        yAxisTitle={props.yAxisTitle?.value}
                    />
                    {noData ? <div className="stc-overlay">No status changes in this period range.</div> : null}
                    <table className="stc-sr-only">
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
            )}
        </div>
    );
}
