import { useEffect, useRef } from "react";

// Keeps a page's data live without a manual reload: calls `refresh` every
// `intervalMs` while the tab is visible, and straight away whenever the
// user comes back to the tab or window. `refresh` should reload quietly
// (no full-page "Loading…" flash) — the data on screen just updates.
export function useAutoRefresh(refresh, intervalMs = 10000) {
  const latest = useRef(refresh);

  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    let running = false;
    const run = async () => {
      if (document.visibilityState !== "visible" || running || !navigator.onLine) return;
      running = true;
      try { await latest.current(); } catch { /* Page loaders retain their last successful data. */ }
      finally { running = false; }
    };

    const timer = setInterval(run, intervalMs);
    window.addEventListener("focus", run);
    window.addEventListener("online", run);
    window.addEventListener("spotx:data-changed", run);
    document.addEventListener("visibilitychange", run);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", run);
      window.removeEventListener("online", run);
      window.removeEventListener("spotx:data-changed", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [intervalMs]);
}
