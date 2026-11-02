/**
 * This file was generated from StatusTimelineChart.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue, ListAttributeValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type ModeEnum = "snapshot" | "moves";

export type PeriodEnum = "day" | "week" | "month" | "quarter" | "year";

export type EndAtEnum = "today" | "lastChange";

export type WeekStartEnum = "monday" | "sunday";

export type ChartStyleEnum = "bars" | "columns" | "area" | "lines";

export type LegendPositionEnum = "top" | "bottom" | "left" | "right";

export type SaveInEnum = "browser" | "attribute";

export interface StatusTimelineChartContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    changes: ListValue;
    changeDate: ListAttributeValue<Date>;
    statusValue: ListAttributeValue<string | Big>;
    itemId?: ListAttributeValue<string | Big>;
    statuses?: ListValue;
    statusName?: ListAttributeValue<string>;
    statusColor?: ListAttributeValue<string>;
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
    statusColors: string;
    hiddenStatuses: string;
    statusOrder: string;
    xAxisTitle?: DynamicValue<string>;
    yAxisTitle?: DynamicValue<string>;
    dateFormat: string;
    showLegend: boolean;
    legendPosition: LegendPositionEnum;
    showSwitcher: boolean;
    showOptions: boolean;
    offerBars: boolean;
    offerColumns: boolean;
    offerArea: boolean;
    offerLines: boolean;
    rememberChoices: boolean;
    saveIn: SaveInEnum;
    choicesAttribute?: EditableValue<string>;
    onChoicesSaved?: ActionValue;
}

export interface StatusTimelineChartPreviewProps {
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
    statusValue: string;
    itemId: string;
    statuses: {} | { caption: string } | { type: string } | null;
    statusName: string;
    statusColor: string;
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
    statusColors: string;
    hiddenStatuses: string;
    statusOrder: string;
    xAxisTitle: string;
    yAxisTitle: string;
    dateFormat: string;
    showLegend: boolean;
    legendPosition: LegendPositionEnum;
    showSwitcher: boolean;
    showOptions: boolean;
    offerBars: boolean;
    offerColumns: boolean;
    offerArea: boolean;
    offerLines: boolean;
    rememberChoices: boolean;
    saveIn: SaveInEnum;
    choicesAttribute: string;
    onChoicesSaved: {} | null;
}
