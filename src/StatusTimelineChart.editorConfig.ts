import { hidePropertiesIn, hidePropertyIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";
import { StatusTimelineChartPreviewProps } from "../typings/StatusTimelineChartProps";

/** Hides settings that do nothing with the current choices, so the dialog stays short. */
export function getProperties(values: StatusTimelineChartPreviewProps, defaultProperties: Properties): Properties {
    if (values.period !== "week") {
        hidePropertyIn(defaultProperties, values, "weekStart");
    }
    if (!values.showLegend) {
        hidePropertyIn(defaultProperties, values, "legendPosition");
    }
    if (!values.showSwitcher) {
        hidePropertiesIn(defaultProperties, values, [
            "offerBars",
            "offerColumns",
            "offerArea",
            "offerLines",
            "rememberStyle"
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
                message: 'The style switcher needs at least two styles: tick more "Offer ..." settings.'
            });
        }
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
