import { hidePropertiesIn, hidePropertyIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";
import { StatusTimelineChartPreviewProps } from "../typings/StatusTimelineChartProps";

/** Hides settings that do nothing with the current choices, so the dialog stays short. */
export function getProperties(values: StatusTimelineChartPreviewProps, defaultProperties: Properties): Properties {
    const weekly = values.period === "week" || values.period === "quarter" || values.columnUnit === "week";
    if (!weekly) {
        hidePropertyIn(defaultProperties, values, "weekStart");
    }
    if (!values.showLegend) {
        hidePropertyIn(defaultProperties, values, "legendPosition");
    }
    if (!values.showSwitcher && !values.showOptions) {
        hidePropertiesIn(defaultProperties, values, [
            "offerBars",
            "offerColumns",
            "offerArea",
            "offerLines",
            "rememberChoices",
            "saveIn",
            "choicesAttribute",
            "onChoicesSaved"
        ]);
    } else if (!values.rememberChoices) {
        hidePropertiesIn(defaultProperties, values, ["saveIn", "choicesAttribute", "onChoicesSaved"]);
    } else if (values.saveIn !== "attribute") {
        hidePropertiesIn(defaultProperties, values, ["choicesAttribute", "onChoicesSaved"]);
    }
    if (!values.showExport) {
        hidePropertiesIn(defaultProperties, values, [
            "exportImage",
            "exportCopy",
            "exportCsv",
            "exportPdf",
            "exportFileName",
            "exportStamp"
        ]);
    }
    if (!isSet(values.statuses)) {
        hidePropertiesIn(defaultProperties, values, ["statusName", "statusColor"]);
    } else {
        // with a Statuses list the order comes from that list
        hidePropertyIn(defaultProperties, values, "statusOrder");
    }
    return defaultProperties;
}

export function check(values: StatusTimelineChartPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.mode === "snapshot" && !values.itemId) {
        problems.push({
            property: "itemId",
            message:
                'Item ID is required for "Snapshot at period end": select an attribute that is unique per item (e.g. its number or id). Or set "What to count" to "Changes per period".'
        });
    }
    if (isSet(values.statuses) && !values.statusName) {
        problems.push({ property: "statusName", message: "Select the status name attribute for the Statuses list." });
    }
    if (values.showSwitcher) {
        const offered = [
            values.offerBars || values.chartStyle === "bars",
            values.offerColumns || values.chartStyle === "columns",
            values.offerArea || values.chartStyle === "area",
            values.offerLines || values.chartStyle === "lines"
        ].filter(Boolean).length;
        if (offered < 2) {
            problems.push({
                property: "showSwitcher",
                severity: "warning",
                message: 'The style switcher needs at least two styles: tick more under "Styles users may pick".'
            });
        }
    }
    if (values.showExport && !values.exportImage && !values.exportCopy && !values.exportCsv && !values.exportPdf) {
        problems.push({
            property: "showExport",
            severity: "warning",
            message: "The export button has nothing to offer: switch on at least one export format."
        });
    }
    const userOptions = values.showSwitcher || values.showOptions;
    if (userOptions && values.rememberChoices && values.saveIn === "attribute" && !values.choicesAttribute) {
        problems.push({
            property: "choicesAttribute",
            message:
                'Select an unlimited String attribute to save user choices in (put the widget in a data view), or set "Save choices in" to Browser.'
        });
    }
    if (values.periodCount !== null && values.periodCount < 0) {
        problems.push({ property: "periodCount", message: "Periods to show must be 0 (everything) or more." });
    }
    if (values.height !== null && values.height < 120) {
        problems.push({
            property: "height",
            severity: "warning",
            message: "Heights below 120 px leave little room for the bars."
        });
    }
    return problems;
}

function isSet(datasource: unknown): boolean {
    return !!datasource && typeof datasource === "object" && Object.keys(datasource).length > 0;
}
