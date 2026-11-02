// Renders the Studio Pro design-mode preview bundle (CommonJS) for a visual check.
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import * as jsxRuntime from "react/jsx-runtime";

const src = window.__previewSrc;
const module = { exports: {} };
new Function("require", "module", "exports", src)(() => jsxRuntime, module, module.exports);
const base = { className: "", height: 300, showLegend: true, title: "Items per status" };
[["bars"], ["columns"], ["area"], ["lines", true]].forEach(([chartStyle, showSwitcher]) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    document.getElementById("root").appendChild(cell);
    createRoot(cell).render(module.exports.preview({ ...base, chartStyle, showSwitcher, offerBars: true, offerColumns: true, offerArea: false, offerLines: true }));
});
