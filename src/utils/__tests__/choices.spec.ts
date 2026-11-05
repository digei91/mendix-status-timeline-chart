import { offeredStyles } from "../styles";
import {
    changedOnly,
    ChartOptions,
    mergeOptions,
    readFromBrowser,
    readFromJson,
    sanitizeChoices,
    writeToBrowser,
    writeToJson
} from "../choices";

const all = { bars: true, columns: true, area: true, lines: true };

describe("offeredStyles", () => {
    it("offers nothing when the switcher is off", () => {
        expect(offeredStyles(false, "bars", all)).toEqual([]);
    });

    it("keeps the fixed order and always includes the start style", () => {
        expect(offeredStyles(true, "lines", { bars: false, columns: true, area: false, lines: false })).toEqual([
            "columns",
            "lines"
        ]);
        expect(offeredStyles(true, "bars", all)).toEqual(["bars", "columns", "area", "lines"]);
    });
});

const defaults: ChartOptions = {
    chartStyle: "bars",
    mode: "snapshot",
    period: "month",
    periodCount: 12,
    columnUnit: "auto",
    endAt: "today",
    title: "Items per status",
    xAxisTitle: "",
    yAxisTitle: "Items",
    dateFormat: "",
    showLegend: true,
    legendPosition: "bottom"
};

describe("user choices", () => {
    it("keeps only known keys with valid values", () => {
        expect(
            sanitizeChoices({
                period: "week",
                periodCount: 6,
                mode: "nonsense",
                showLegend: "yes",
                legendPosition: "left",
                hacker: 1,
                title: ""
            })
        ).toEqual({ period: "week", periodCount: 6, legendPosition: "left", title: "" });
        expect(sanitizeChoices({ periodCount: -1 })).toEqual({});
        expect(sanitizeChoices({ periodCount: 2.5 })).toEqual({});
        expect(sanitizeChoices(null)).toEqual({});
    });

    it("merges over the Studio Pro defaults and drops unchanged values", () => {
        const merged = mergeOptions(defaults, { period: "week", title: "" });
        expect(merged.period).toBe("week");
        expect(merged.title).toBe("");
        expect(merged.yAxisTitle).toBe("Items");
        expect(changedOnly(defaults, { period: "month", periodCount: 6 })).toEqual({ periodCount: 6 });
    });

    it("shares one JSON attribute between widgets", () => {
        let json = writeToJson(undefined, "chart1", { period: "week" });
        json = writeToJson(json, "chart2", { showLegend: false });
        expect(readFromJson(json, "chart1")).toEqual({ period: "week" });
        expect(readFromJson(json, "chart2")).toEqual({ showLegend: false });
        json = writeToJson(json, "chart1", {});
        expect(JSON.parse(json)).toEqual({ chart2: { showLegend: false } });
        expect(readFromJson("not json", "chart1")).toEqual({});
        expect(writeToJson("[1,2]", "c", { mode: "moves" })).toBe('{"c":{"mode":"moves"}}');
    });

    it("stores choices in the browser per widget", () => {
        writeToBrowser("w", { chartStyle: "lines" });
        expect(readFromBrowser("w")).toEqual({ chartStyle: "lines" });
        writeToBrowser("w", {});
        expect(readFromBrowser("w")).toEqual({});
    });
});
