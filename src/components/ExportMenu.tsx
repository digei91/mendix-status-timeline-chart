import { KeyboardEvent, ReactElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { usePopup } from "./usePopup";

export type ExportKind = "image" | "copy" | "csv" | "pdf";

const LABELS: Record<ExportKind, string> = {
    image: "Download image (PNG)",
    copy: "Copy image",
    csv: "Download data (CSV)",
    pdf: "Print or save as PDF"
};

export interface ExportMenuProps {
    kinds: ExportKind[];
    disabled: boolean;
    onExport: (kind: ExportKind) => Promise<string | undefined>;
    /** Pop-up state is owned by the widget, so it can lift the widget above the content below while open. */
    open: boolean;
    setOpen: (open: boolean) => void;
}

/** Download button with a small menu of export formats. Shows a short message after copying or on errors. */
export function ExportMenu({ kinds, disabled, onExport, open, setOpen }: ExportMenuProps): ReactElement {
    const [message, setMessage] = useState("");
    const menuId = useId();
    const anchorRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const close = useCallback(() => setOpen(false), [setOpen]);
    usePopup(open, close, anchorRef, toggleRef);

    // each message stays 4 s; a newer message restarts the timer so an older export cannot clear it
    const messageTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(messageTimer.current), []);
    const show = (text: string): void => {
        clearTimeout(messageTimer.current);
        setMessage(text);
        if (text) {
            messageTimer.current = setTimeout(() => setMessage(""), 4000);
        }
    };

    const run = (kind: ExportKind): void => {
        setOpen(false);
        toggleRef.current?.focus();
        onExport(kind).then(
            text => show(text ?? ""),
            () => show("Export failed. Please try again.")
        );
    };

    // arrow keys move between menu items, like a native menu
    const onMenuKey = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
            return;
        }
        e.preventDefault();
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]"));
        const at = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    };

    return (
        <div className="stc-options-anchor" ref={anchorRef}>
            <button
                ref={toggleRef}
                type="button"
                className={"stc-switch stc-options-toggle" + (open ? " stc-switch-active" : "")}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                title="Export"
                disabled={disabled}
                onClick={() => setOpen(!open)}
            >
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 11.5v2h11v-2"
                    />
                </svg>
                <span className="stc-switch-label">Export</span>
            </button>
            {open ? (
                <div
                    id={menuId}
                    className="stc-popup stc-menu"
                    role="menu"
                    aria-label="Export"
                    onKeyDown={onMenuKey}
                    ref={el => el?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus()}
                >
                    {kinds.map(kind => (
                        <button
                            key={kind}
                            type="button"
                            role="menuitem"
                            className="stc-menu-item"
                            onClick={() => run(kind)}
                        >
                            {LABELS[kind]}
                        </button>
                    ))}
                </div>
            ) : null}
            <span className="stc-toast" role="status" aria-live="polite">
                {message}
            </span>
        </div>
    );
}
