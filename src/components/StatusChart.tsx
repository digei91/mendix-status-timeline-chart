import { ReactElement, useEffect, useRef } from "react";
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    ChartDataset,
    ChartOptions,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    Plugin,
    PointElement,
    ScriptableContext,
    Tooltip
} from "chart.js";
import { GRID, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, withAlpha } from "../utils/colors";

Chart.register(
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler
);

export type ChartStyle = "bars" | "area" | "lines";
export type LegendPosition = "top" | "bottom" | "left" | "right";

export interface Series {
    name: string;
    color: string;
    data: number[];
}

export interface StatusChartProps {
    labels: string[];
    series: Series[];
    chartStyle: ChartStyle;
    height: number;
    showTotal: boolean;
    showGrid: boolean;
    showLegend: boolean;
    legendPosition: LegendPosition;
    xAxisTitle?: string;
    yAxisTitle?: string;
    totalLabel?: string;
}

const TOTAL_ID = "__total__";
/** Below this width per period the totals on top of the stacks would overlap, so they are left out. */
const MIN_TOTAL_LABEL_SPACE = 22;

type AnyDataset = ChartDataset<"bar" | "line", number[]> & { id?: string };

function visibleTotals(chart: Chart): number[] {
    const totals: number[] = [];
    chart.data.datasets.forEach((ds, i) => {
        if ((ds as AnyDataset).id === TOTAL_ID || !chart.isDatasetVisible(i)) {
            return;
        }
        (ds.data as number[]).forEach((v, j) => {
            totals[j] = (totals[j] ?? 0) + (v ?? 0);
        });
    });
    return totals;
}

/** Writes the stack total above each period (stacked bars / area). */
const totalLabelsPlugin: Plugin = {
    id: "stcTotals",
    afterDatasetsDraw(chart, _args, options: { enabled?: boolean }) {
        if (!options.enabled) {
            return;
        }
        const x = chart.scales.x;
        const y = chart.scales.y;
        const labels = chart.data.labels ?? [];
        if (!labels.length || chart.chartArea.width / labels.length < MIN_TOTAL_LABEL_SPACE) {
            return;
        }
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = TEXT_SECONDARY;
        ctx.font = `600 11px ${Chart.defaults.font.family}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        visibleTotals(chart).forEach((total, i) => {
            if (total > 0) {
                ctx.fillText(String(total), x.getPixelForValue(i), y.getPixelForValue(total) - 4);
            }
        });
        ctx.restore();
    }
};

function buildDatasets(props: StatusChartProps): AnyDataset[] {
    const { series, chartStyle } = props;
    const datasets: AnyDataset[] = series.map((s, index) => {
        if (chartStyle === "bars") {
            return {
                type: "bar",
                label: s.name,
                data: s.data,
                backgroundColor: s.color,
                hoverBackgroundColor: s.color,
                // a 2px surface-colored top edge separates the stacked segments
                borderColor: SURFACE,
                borderWidth: { top: 2, right: 0, bottom: 0, left: 0 },
                borderSkipped: false,
                borderRadius: (ctx: ScriptableContext<"bar">) =>
                    isTopOfStack(ctx) ? { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } : 0,
                maxBarThickness: 56
            };
        }
        const area = chartStyle === "area";
        return {
            type: "line",
            label: s.name,
            data: s.data,
            borderColor: s.color,
            backgroundColor: area ? withAlpha(s.color, 0.55) : s.color,
            fill: area ? (index === 0 ? "origin" : "-1") : false,
            borderWidth: 2,
            cubicInterpolationMode: "monotone",
            pointRadius: area ? 0 : 4,
            pointHoverRadius: 5,
            pointBackgroundColor: s.color,
            pointBorderColor: SURFACE,
            pointBorderWidth: area ? 0 : 2
        };
    });
    if (chartStyle === "lines" && props.showTotal && series.length > 1) {
        const totals = props.labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] ?? 0), 0));
        datasets.push({
            id: TOTAL_ID,
            type: "line",
            label: props.totalLabel ?? "Total",
            data: totals,
            borderColor: TEXT_SECONDARY,
            backgroundColor: TEXT_SECONDARY,
            borderDash: [6, 4],
            borderWidth: 2,
            cubicInterpolationMode: "monotone",
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false
        });
    }
    return datasets;
}

/** True when no visible dataset above this one has a value at this period, so this segment gets the rounded top. */
function isTopOfStack(ctx: ScriptableContext<"bar">): boolean {
    const { chart, datasetIndex, dataIndex } = ctx;
    if (!chart.data.datasets[datasetIndex]?.data[dataIndex]) {
        return false;
    }
    for (let i = datasetIndex + 1; i < chart.data.datasets.length; i++) {
        if (chart.isDatasetVisible(i) && Number(chart.data.datasets[i].data[dataIndex]) > 0) {
            return false;
        }
    }
    return true;
}

function buildOptions(props: StatusChartProps): ChartOptions<"bar" | "line"> {
    const stacked = props.chartStyle !== "lines";
    const axisTitle = (text?: string): { display: boolean; text: string; color: string } => ({
        display: !!text,
        text: text ?? "",
        color: TEXT_SECONDARY
    });
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: "index", intersect: false },
        scales: {
            x: {
                stacked,
                grid: { display: false },
                border: { color: GRID },
                ticks: { color: TEXT_SECONDARY, maxRotation: 0, autoSkipPadding: 12 },
                title: axisTitle(props.xAxisTitle)
            },
            y: {
                stacked,
                beginAtZero: true,
                grace: props.showTotal && stacked ? "8%" : 0,
                grid: { display: props.showGrid, color: GRID },
                border: { display: false },
                ticks: { color: TEXT_SECONDARY, precision: 0 },
                title: axisTitle(props.yAxisTitle)
            }
        },
        plugins: {
            legend: {
                display: props.showLegend && props.series.length > 0,
                position: props.legendPosition,
                // stacked: legend in the same top-to-bottom order as the stack
                reverse: stacked && (props.legendPosition === "left" || props.legendPosition === "right"),
                labels: {
                    color: TEXT_PRIMARY,
                    usePointStyle: true,
                    pointStyle: "rectRounded",
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 14
                }
            },
            tooltip: {
                backgroundColor: SURFACE,
                titleColor: TEXT_PRIMARY,
                bodyColor: TEXT_PRIMARY,
                footerColor: TEXT_PRIMARY,
                borderColor: GRID,
                borderWidth: 1,
                padding: 10,
                usePointStyle: true,
                boxPadding: 4,
                // top of the stack first, like on screen
                itemSort: (a, b) => (stacked ? b.datasetIndex - a.datasetIndex : a.datasetIndex - b.datasetIndex),
                filter: item => (item.dataset as AnyDataset).id !== TOTAL_ID,
                callbacks: {
                    footer: items => {
                        if (!items.length || props.series.length < 2) {
                            return "";
                        }
                        const total = visibleTotals(items[0].chart)[items[0].dataIndex] ?? 0;
                        return `${props.totalLabel ?? "Total"}: ${total}`;
                    }
                }
            },
            // custom plugin options
            ...({ stcTotals: { enabled: props.showTotal && stacked } } as object)
        }
    };
}

export function StatusChart(props: StatusChartProps): ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const styleRef = useRef<ChartStyle | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const datasets = buildDatasets(props);
        const options = buildOptions(props);
        const chart = chartRef.current;
        if (chart && styleRef.current === props.chartStyle) {
            chart.data.labels = props.labels;
            chart.data.datasets = datasets as Chart["data"]["datasets"];
            chart.options = options as Chart["options"];
            chart.update();
            return;
        }
        chart?.destroy();
        Chart.defaults.font.family = getComputedStyle(canvas).fontFamily || Chart.defaults.font.family;
        chartRef.current = new Chart(canvas, {
            type: props.chartStyle === "bars" ? "bar" : "line",
            data: { labels: props.labels, datasets: datasets as Array<ChartDataset<"bar" | "line", number[]>> },
            options,
            plugins: [totalLabelsPlugin]
        }) as unknown as Chart;
        styleRef.current = props.chartStyle;
    });

    useEffect(
        () => () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        },
        []
    );

    return (
        <div className="stc-canvas-wrap" style={{ height: props.height }}>
            <canvas ref={canvasRef} role="img" aria-label={describe(props)} />
        </div>
    );
}

function describe(props: StatusChartProps): string {
    if (!props.labels.length) {
        return "Empty chart";
    }
    return `Items per status from ${props.labels[0]} to ${props.labels[props.labels.length - 1]}: ${props.series
        .map(s => s.name)
        .join(", ")}`;
}
