import { useEffect, useRef } from "react";

// Keep keyboard navigation inside a dialog and return focus to its opener.
export function useDialogFocus(onClose, busy = false) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const panel = ref.current;
    const controls = () => Array.from(panel?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
    (controls()[0] || panel)?.focus();
    const handleKey = event => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = controls();
      if (!items.length) { event.preventDefault(); panel?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    panel?.addEventListener("keydown", handleKey);
    return () => {
      panel?.removeEventListener("keydown", handleKey);
      if (opener?.isConnected) opener.focus();
    };
  }, [onClose, busy]);
  return ref;
}
