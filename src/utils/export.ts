import type { Series } from "../components/StatusChart";
import type { CountMode } from "./aggregate";
import type { PeriodUnit } from "./periods";

const UNIT_NAMES: Record<PeriodUnit, [string, string]> = {
    day: ["day", "days"],
    week: ["week", "weeks"],
    month: ["month", "months"],
    quarter: ["quarter", "quarters"],
    year: ["year", "years"]
};
const MODE_NAMES: Record<CountMode, string> = {
    snapshot: "Snapshot at period end",
    moves: "Changes per period"
};

const pad = (n: number): string => String(n).padStart(2, "0");

/** 2026-11-02 (local time). */
export function isoDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Exported 2026-11-02 16:20 · Last 1 year · per month · Snapshot at period end" */
export function exportedLine(
    date: Date,
    rangeUnit: PeriodUnit,
    count: number,
    columnUnit: PeriodUnit,
    mode: CountMode
): string {
    const [one, many] = UNIT_NAMES[rangeUnit];
    const span = count > 0 ? `Last ${count} ${count === 1 ? one : many}` : "All time";
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return `Exported ${isoDate(date)} ${time} · ${span} · per ${UNIT_NAMES[columnUnit][0]} · ${MODE_NAMES[mode]}`;
}

/**
 * File name from a pattern with {title} and {date}, without the extension. Characters Windows does not allow are
 * replaced, so the download never fails on a title like "Open/Closed: Q1?".
 */
export function exportFileName(pattern: string | undefined, title: string, date: Date): string {
    const name = (pattern || "{title} - {date}")
        .replace(/\{title\}/gi, title.trim() || "Chart")
        .replace(/\{date\}/gi, isoDate(date))
        // eslint-disable-next-line no-control-regex
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
        .replace(/\s+/g, " ")
        .replace(/^[\s.-]+|[\s.]+$/g, "")
        .slice(0, 120)
        .trim();
    return name || "Chart";
}

function csvCell(value: string | number): string {
    const text = String(value);
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The visible data as CSV for Excel: ";" separated, UTF-8 with BOM (so Excel shows accents), one row per period,
 * one column per visible status plus Total. The optional first line says when and how it was exported.
 */
export function buildCsv(labels: string[], series: Series[], stamp?: string): string {
    const rows: Array<Array<string | number>> = [];
    if (stamp) {
        rows.push([stamp], []);
    }
    rows.push(["Period", ...series.map(s => s.name), "Total"]);
    labels.forEach((label, i) => {
        const values = series.map(s => s.data[i] ?? 0);
        rows.push([label, ...values, values.reduce((a, b) => a + b, 0)]);
    });
    return "﻿" + rows.map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // give the browser time to start the download before the URL is released
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function canCopyImage(): boolean {
    return (
        typeof window !== "undefined" &&
        window.isSecureContext &&
        typeof (window as any).ClipboardItem === "function" &&
        typeof navigator.clipboard?.write === "function"
    );
}

/** Puts a PNG on the clipboard. The blob is passed as a promise so Safari keeps the click's permission. */
export async function copyImage(png: Promise<Blob>): Promise<void> {
    const Item = (window as any).ClipboardItem;
    await navigator.clipboard.write([new Item({ "image/png": png })]);
}

const escapeHtml = (text: string): string =>
    text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** HTML page for printing / Save as PDF: the chart picture, then the data table and the exported line. */
export function printHtml(
    docTitle: string,
    imageUrl: string,
    labels: string[],
    series: Series[],
    stamp?: string
): string {
    const head = ["Period", ...series.map(s => s.name), "Total"].map(h => `<th>${escapeHtml(h)}</th>`).join("");
    const body = labels
        .map((label, i) => {
            const values = series.map(s => s.data[i] ?? 0);
            const cells = [...values, values.reduce((a, b) => a + b, 0)].map(v => `<td>${v}</td>`).join("");
            return `<tr><th>${escapeHtml(label)}</th>${cells}</tr>`;
        })
        .join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title><style>
@page { margin: 14mm; }
body { margin: 0; font-family: "Segoe UI", "Open Sans", Arial, sans-serif; color: #0b0b0b; }
img { display: block; width: 100%; height: auto; }
table { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 11px; page-break-inside: auto; }
th, td { padding: 4px 6px; border-bottom: 1px solid #e4e3df; text-align: right; }
th:first-child, thead th:first-child { text-align: left; }
thead th { border-bottom: 2px solid #52514e; }
tr { page-break-inside: avoid; }
.stamp { margin-top: 10px; font-size: 10px; color: #52514e; }
</style></head><body><img src="${imageUrl}" alt="${escapeHtml(
        docTitle
    )}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${
        stamp ? `<div class="stamp">${escapeHtml(stamp)}</div>` : ""
    }</body></html>`;
}

/**
 * Prints the page in a hidden frame, so only the chart is printed and not the rest of the Mendix page.
 * The browser's print dialog offers "Save as PDF".
 */
export function printInFrame(html: string, onDone: () => void): void {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const cleanUp = (): void => {
        frame.remove();
        onDone();
    };
    frame.onload = () => {
        const win = frame.contentWindow;
        const img = frame.contentDocument?.querySelector("img");
        const go = (): void => {
            if (!win) {
                cleanUp();
                return;
            }
            win.addEventListener("afterprint", () => setTimeout(cleanUp, 100));
            win.focus();
            win.print();
            // some browsers do not fire afterprint; never leave the frame behind
            setTimeout(() => frame.isConnected && cleanUp(), 60000);
        };
        if (img && !img.complete) {
            img.onload = go;
        } else {
            go();
        }
    };
    frame.srcdoc = html;
}
