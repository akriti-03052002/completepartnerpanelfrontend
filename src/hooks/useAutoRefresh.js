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
    let eventTimer;
    // Returning to a tab emits both focus and visibilitychange. Batch them
    // into one refresh, including pages whose callback just updates state.
    const schedule = () => { clearTimeout(eventTimer); eventTimer = setTimeout(run, 150); };
    window.addEventListener("focus", schedule);
    window.addEventListener("online", schedule);
    window.addEventListener("spotx:data-changed", schedule);
    document.addEventListener("visibilitychange", schedule);

    return () => {
      clearInterval(timer);
      clearTimeout(eventTimer);
      window.removeEventListener("focus", schedule);
      window.removeEventListener("online", schedule);
      window.removeEventListener("spotx:data-changed", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [intervalMs]);
}
