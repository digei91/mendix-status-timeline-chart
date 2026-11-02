import { hidePropertiesIn, hidePropertyIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";
import { TicketStatusChartPreviewProps } from "../typings/TicketStatusChartProps";

/** Hides settings that do nothing with the current choices, so the dialog stays short. */
export function getProperties(values: TicketStatusChartPreviewProps, defaultProperties: Properties): Properties {
    if (values.period !== "week") {
        hidePropertyIn(defaultProperties, values, "weekStart");
    }
    if (!values.showLegend) {
        hidePropertyIn(defaultProperties, values, "legendPosition");
    }
    if (!isSet(values.lanes)) {
        hidePropertiesIn(defaultProperties, values, ["laneName", "laneColor"]);
    } else {
        // with a Lanes list the order comes from that list
        hidePropertyIn(defaultProperties, values, "laneOrder");
    }
    return defaultProperties;
}

export function check(values: TicketStatusChartPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.mode === "snapshot" && !values.ticketId) {
        problems.push({
            property: "ticketId",
            message:
                'Ticket ID is required for "Lane snapshot": select something unique per ticket, e.g. LogLine_Log/Log/Log_Ticket/Ticket/TicketNumber. Or switch "What to count" to "Moves per period".'
        });
    }
    if (isSet(values.lanes) && !values.laneName) {
        problems.push({ property: "laneName", message: "Select the lane name attribute for the Lanes list." });
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
