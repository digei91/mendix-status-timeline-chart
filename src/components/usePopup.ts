import { RefObject, useEffect } from "react";

/** Closes a pop-up on a click outside `anchor` or on Escape (focus then goes back to the toggle button). */
export function usePopup(
    open: boolean,
    close: () => void,
    anchor: RefObject<HTMLElement>,
    toggle: RefObject<HTMLElement>
): void {
    useEffect(() => {
        if (!open) {
            return;
        }
        const onPointer = (e: MouseEvent): void => {
            if (!anchor.current?.contains(e.target as Node)) {
                close();
            }
        };
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") {
                close();
                toggle.current?.focus();
            }
        };
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, close, anchor, toggle]);
}
