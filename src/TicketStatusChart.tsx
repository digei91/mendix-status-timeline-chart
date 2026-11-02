import { ReactElement, useMemo } from "react";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

import { TicketStatusChartContainerProps } from "../typings/TicketStatusChartProps";
import { StatusChart, Series } from "./components/StatusChart";
import { aggregate, ChangeRow, orderLanes, parseColorMap, resolveLane, splitList } from "./utils/aggregate";
import { laneColors } from "./utils/colors";
import { formatPeriod, WeekStart } from "./utils/periods";

import "./ui/TicketStatusChart.css";

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

export function TicketStatusChart(props: TicketStatusChartContainerProps): ReactElement {
    const { changes, lanes } = props;
    const weekStart: WeekStart = props.weekStart === "sunday" ? 0 : 1;

    const laneInfo = useMemo(() => {
        const idToName = new Map<string, string>();
        const known: string[] = [];
        const colorOf = new Map<string, string>();
        if (lanes?.status === ValueStatus.Available && lanes.items && props.laneName) {
            for (const item of lanes.items) {
                const name = readText(props.laneName, item);
                if (!name) {
                    continue;
                }
                idToName.set(String(item.id), name);
                known.push(name);
                const color = readText(props.laneColor, item);
                if (color) {
                    colorOf.set(name, color);
                }
            }
        }
        return { idToName, known, colorOf };
    }, [lanes, props.laneName, props.laneColor]);

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
                lane: resolveLane(readText(props.laneValue, item), laneInfo.idToName),
                ticket: readText(props.ticketId, item)
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
        props.laneValue,
        props.ticketId,
        props.mode,
        props.period,
        props.periodCount,
        props.endAt,
        weekStart,
        laneInfo
    ]);

    const chart = useMemo(() => {
        if (!result) {
            return undefined;
        }
        const locale = sessionLocale();
        const labels = result.periods.map(p => formatPeriod(p, props.period, props.dateFormat, locale, weekStart));
        const ordered = orderLanes([...result.counts.keys()], laneInfo.known, splitList(props.laneOrder));
        const colors = laneColors(ordered, laneInfo.colorOf, parseColorMap(props.laneColors));
        const hidden = new Set(splitList(props.hiddenLanes).map(l => l.toLowerCase()));
        const series: Series[] = ordered
            .filter(lane => !hidden.has(lane.toLowerCase()))
            .map(lane => ({
                name: lane,
                color: colors.get(lane)!,
                data: result.counts.get(lane) ?? new Array(labels.length).fill(0)
            }));
        return { labels, series };
    }, [
        result,
        props.period,
        props.dateFormat,
        props.laneOrder,
        props.laneColors,
        props.hiddenLanes,
        laneInfo,
        weekStart
    ]);

    const title = props.title?.value;
    const missingTicketId = props.mode === "snapshot" && !props.ticketId;
    const noData = chart && chart.series.every(s => s.data.every(v => v === 0));

    return (
        <div className={["widget-ticket-status-chart", props.class].join(" ").trim()} style={props.style}>
            {title ? <div className="tsc-title">{title}</div> : null}
            {missingTicketId ? (
                <div className="tsc-message tsc-message-error">
                    &quot;Lane snapshot&quot; needs the Ticket ID setting (Data tab) to know which changes belong to the
                    same ticket.
                </div>
            ) : null}
            {!chart ? (
                <div className="tsc-message" style={{ height: props.height }}>
                    Loading…
                </div>
            ) : (
                <div className="tsc-body">
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
                    {noData ? <div className="tsc-overlay">No status changes in this period range.</div> : null}
                    <table className="tsc-sr-only">
                        <caption>{title || "Tickets per lane"}</caption>
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
