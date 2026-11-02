import { offeredStyles, readStoredStyle } from "../styles";

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

describe("readStoredStyle", () => {
    afterEach(() => window.localStorage.clear());

    it("returns a stored style only when it is still offered", () => {
        window.localStorage.setItem("k", "area");
        expect(readStoredStyle("k", ["bars", "area"])).toBe("area");
        expect(readStoredStyle("k", ["bars", "lines"])).toBeUndefined();
        expect(readStoredStyle("missing", ["bars"])).toBeUndefined();
    });
});
