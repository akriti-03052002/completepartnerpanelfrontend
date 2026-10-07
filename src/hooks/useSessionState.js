import { useEffect, useState } from "react";
// UI preferences stay within this browser session and signed-in account.
export function useSessionState(name, initial) {
  let account = "anonymous";
  try {
    const stored = JSON.parse(localStorage.getItem(window.location.pathname.startsWith("/admin") ? "adminUser" : window.location.pathname.startsWith("/partner") ? "partnerUser" : "customer") || "null");
    account = stored?.id || stored?._id || stored?.email || account;
  } catch { /* Storage may be unavailable. */ }
  const key = `ui:${account}:${window.location.pathname}:${name}`;
  const read = () => { try { const raw = sessionStorage.getItem(key); return raw === null ? initial : JSON.parse(raw); } catch { return initial; } };
  const [entries, setEntries] = useState(() => ({ [key]: read() }));
  const value = Object.hasOwn(entries, key) ? entries[key] : read();
  const setValue = (next) => setEntries((current) => ({ ...current, [key]: typeof next === "function" ? next(Object.hasOwn(current, key) ? current[key] : read()) : next }));
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep working without persistence. */ } }, [key, value]);
  return [value, setValue];
}
