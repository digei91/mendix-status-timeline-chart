/**
 * This file was generated from TicketStatusChart.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListAttributeValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type ModeEnum = "snapshot" | "moves";

export type PeriodEnum = "day" | "week" | "month" | "quarter" | "year";

export type EndAtEnum = "today" | "lastChange";

export type WeekStartEnum = "monday" | "sunday";

export type ChartStyleEnum = "bars" | "area" | "lines";

export type LegendPositionEnum = "top" | "bottom" | "left" | "right";

export interface TicketStatusChartContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    changes: ListValue;
    changeDate: ListAttributeValue<Date>;
    laneValue: ListAttributeValue<string | Big>;
    ticketId?: ListAttributeValue<string | Big>;
    lanes?: ListValue;
    laneName?: ListAttributeValue<string>;
    laneColor?: ListAttributeValue<string>;
    mode: ModeEnum;
    period: PeriodEnum;
    periodCount: number;
    endAt: EndAtEnum;
    weekStart: WeekStartEnum;
    chartStyle: ChartStyleEnum;
    title?: DynamicValue<string>;
    height: number;
    showTotal: boolean;
    showGrid: boolean;
    laneColors: string;
    hiddenLanes: string;
    laneOrder: string;
    xAxisTitle?: DynamicValue<string>;
    yAxisTitle?: DynamicValue<string>;
    dateFormat: string;
    showLegend: boolean;
    legendPosition: LegendPositionEnum;
}

export interface TicketStatusChartPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    changes: {} | { caption: string } | { type: string } | null;
    changeDate: string;
    laneValue: string;
    ticketId: string;
    lanes: {} | { caption: string } | { type: string } | null;
    laneName: string;
    laneColor: string;
    mode: ModeEnum;
    period: PeriodEnum;
    periodCount: number | null;
    endAt: EndAtEnum;
    weekStart: WeekStartEnum;
    chartStyle: ChartStyleEnum;
    title: string;
    height: number | null;
    showTotal: boolean;
    showGrid: boolean;
    laneColors: string;
    hiddenLanes: string;
    laneOrder: string;
    xAxisTitle: string;
    yAxisTitle: string;
    dateFormat: string;
    showLegend: boolean;
    legendPosition: LegendPositionEnum;
}
