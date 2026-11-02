import { ReactElement } from "react";
import { StatusTimelineChartPreviewProps } from "../typings/StatusTimelineChartProps";
import { PALETTE, GRID, TEXT_SECONDARY } from "./utils/colors";

const SAMPLE_STATUSES = ["Open", "In progress", "Review", "Done"];
const SAMPLE = [
    [6, 4, 2, 3],
    [8, 5, 3, 6],
    [5, 7, 4, 9],
    [7, 6, 2, 12],
    [4, 8, 5, 15],
    [6, 5, 3, 18]
];
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Static sample chart for Studio Pro's Design mode (no data is available there). */
export function preview(props: StatusTimelineChartPreviewProps): ReactElement {
    const width = 420;
    const height = Math.max(160, Math.min(props.height || 360, 360));
    const plotTop = 18;
    const plotBottom = height - 46;
    const max = Math.max(...SAMPLE.map(r => r.reduce((a, b) => a + b, 0)));
    const scale = (plotBottom - plotTop) / max;
    const lineScale = (plotBottom - plotTop) / Math.max(...SAMPLE.flat());
    const slot = (width - 30) / SAMPLE.length;
    const barW = Math.min(40, slot * 0.6);
    const lineMode = props.chartStyle === "lines";

    return (
        <div className={props.className} style={{ width: "100%" }}>
            {props.title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{props.title}</div> : null}
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
                <line x1={30} x2={width} y1={plotBottom} y2={plotBottom} stroke={GRID} />
                {[0.5, 1].map(f => (
                    <line
                        key={f}
                        x1={30}
                        x2={width}
                        y1={plotBottom - f * max * scale}
                        y2={plotBottom - f * max * scale}
                        stroke={GRID}
                    />
                ))}
                {lineMode
                    ? SAMPLE_STATUSES.map((_, status) => (
                          <polyline
                              key={status}
                              fill="none"
                              stroke={PALETTE[status]}
                              strokeWidth={2}
                              points={SAMPLE.map(
                                  (row, i) => `${30 + slot * i + slot / 2},${plotBottom - row[status] * lineScale}`
                              ).join(" ")}
                          />
                      ))
                    : SAMPLE.map((row, i) => {
                          let y = plotBottom;
                          const x = 30 + slot * i + (slot - barW) / 2;
                          return (
                              <g key={i}>
                                  {row.map((v, status) => {
                                      const h = v * scale;
                                      y -= h;
                                      return (
                                          <rect
                                              key={status}
                                              x={x}
                                              y={y}
                                              width={barW}
                                              height={Math.max(0, h - 2)}
                                              fill={PALETTE[status]}
                                              opacity={props.chartStyle === "area" ? 0.7 : 1}
                                          />
                                      );
                                  })}
                              </g>
                          );
                      })}
                {LABELS.map((l, i) => (
                    <text
                        key={l}
                        x={30 + slot * i + slot / 2}
                        y={plotBottom + 14}
                        fontSize={10}
                        textAnchor="middle"
                        fill={TEXT_SECONDARY}
                    >
                        {l}
                    </text>
                ))}
                {props.showLegend
                    ? SAMPLE_STATUSES.map((l, i) => (
                          <g key={l} transform={`translate(${40 + i * 92}, ${height - 14})`}>
                              <rect width={9} height={9} rx={2} fill={PALETTE[i]} />
                              <text x={14} y={8} fontSize={10} fill={TEXT_SECONDARY}>
                                  {l}
                              </text>
                          </g>
                      ))
                    : null}
            </svg>
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/StatusTimelineChart.css");
}
