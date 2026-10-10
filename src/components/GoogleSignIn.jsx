import { useEffect, useRef, useState } from "react";
import axios from "axios";

const storageKey = "spotx.google.redirect";
const pendingReturns = new Map();
// Google opens in the same tab; no popup or FedCM script is loaded.
const redirectApi = axios.create({ baseURL: "/api", withCredentials: true });

export default function GoogleSignIn({ api, endpoint, mode = "login", payload = {}, onSuccess, onError, disabled = false }) {
  const latest = useRef();
  const starting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => { latest.current = { onSuccess, onError }; }, [onSuccess, onError]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("google_return") !== "1") return;
    let cancelled = false;
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* handled below */ }
    const finish = () => {
      sessionStorage.removeItem(storageKey);
      const url = new URL(window.location.href);
      url.searchParams.delete("google_return");
      window.history.replaceState(window.history.state, "", url.href);
    };
    if (!saved || saved.endpoint !== endpoint || saved.mode !== mode || Date.now() - saved.createdAt > 10 * 60 * 1000) {
      latest.current.onError?.("Google sign-in expired. Please try again.");
      finish();
      return;
    }
    // React remounts must not consume the result or register twice.
    if (!pendingReturns.has(saved.id)) {
      const result = redirectApi.post("/auth/google/result").then(({ data }) => {
        if (data.endpoint !== endpoint || data.mode !== mode) throw new Error("Google sign-in account type did not match. Please try again.");
        return api.post(`${endpoint}/google/${mode}`, { ...saved.payload, credential: data.credential, nonce: data.nonce });
      });
      pendingReturns.set(saved.id, result);
    }
    pendingReturns.get(saved.id).then(({ data }) => {
      if (!cancelled) { finish(); latest.current.onSuccess(data); }
    }).catch(error => {
      if (!cancelled) {
        finish();
        latest.current.onError?.(error.response?.data?.message || error.message || "Google sign-in failed. Please try again.");
      }
    }).finally(() => {
      if (!cancelled) { setStatus(""); pendingReturns.delete(saved.id); }
    });
    return () => { cancelled = true; };
  }, [api, endpoint, mode]);

  const returning = new URLSearchParams(window.location.search).get("google_return") === "1";
  const start = async () => {
    if (starting.current || disabled || returning) return;
    starting.current = true;
    setBusy(true);
    setStatus("Opening Google...");
    onError?.("");
    try {
      // Preserve registration fields for the return trip, excluding secrets.
      const registration = Object.fromEntries(Object.entries(payload).filter(([key]) => !["password", "confirmPassword", "credential", "nonce", "token"].includes(key)));
      sessionStorage.setItem(storageKey, JSON.stringify({ id: crypto.randomUUID(), endpoint, mode, payload: registration, createdAt: Date.now() }));
      const { data } = await redirectApi.post("/auth/google/start", { endpoint, mode, returnTo: window.location.href });
      const target = new URL(data.url);
      if (target.origin !== "https://accounts.google.com") throw new Error("Google sign-in returned an invalid address.");
      window.location.assign(target.href);
    } catch (error) {
      sessionStorage.removeItem(storageKey);
      onError?.(error.response?.data?.message || error.message || "Google sign-in is unavailable.");
      setBusy(false);
      setStatus("");
      starting.current = false;
    }
  };

  return (
    <div className="my-5">
      <button type="button" onClick={start} disabled={disabled || busy || returning}
        className="w-full flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-1.9 4.6-4.1 6v5h6.6c3.9-3.6 6.1-8.7 6.1-14.7z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.9-3.6-11.5-8.4H5.7v5.2C9.1 39.5 16 44 24 44z" />
          <path fill="#FBBC05" d="M12.5 27.7a12 12 0 0 1 0-7.4v-5.2H5.7a20 20 0 0 0 0 17.8z" />
          <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.9 29.5 4 24 4 16 4 9.1 8.5 5.7 15.1l6.8 5.2C14.1 15.5 18.7 11.9 24 11.9z" />
        </svg>
        {mode === "register" ? "Sign up with Google" : "Sign in with Google"}
      </button>
      {(status || returning) && <p role="status" className="text-center text-xs text-slate-500 mt-2">{returning ? "Completing Google sign-in..." : status}</p>}
      <div className="flex items-center gap-3 mt-5 text-xs text-slate-400"><span className="h-px bg-slate-200 flex-1" />or use email<span className="h-px bg-slate-200 flex-1" /></div>
    </div>
  );
}
