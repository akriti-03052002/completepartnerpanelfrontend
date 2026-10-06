import { useEffect, useRef } from "react";

// Keeps a page's data live without a manual reload: calls `refresh` every
// `intervalMs` while the tab is visible, and straight away whenever the
// user comes back to the tab or window. `refresh` should reload quietly
// (no full-page "Loading…" flash) — the data on screen just updates.
export function useAutoRefresh(refresh, intervalMs = 15000) {
  const latest = useRef(refresh);

  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") latest.current();
    };

    const timer = setInterval(run, intervalMs);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [intervalMs]);
}
