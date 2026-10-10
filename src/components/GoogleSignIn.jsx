import { useEffect, useRef, useState } from "react";

let scriptPromise;
let initializedClientId;
let googleNonce;
let activeSignIn;

function initializeGoogle(clientId) {
  if (initializedClientId === clientId) return;
  if (initializedClientId) {
    throw new Error("Google configuration changed. Reload this page to continue.");
  }
  googleNonce = crypto.randomUUID();
  window.google.accounts.id.initialize({
    client_id: clientId,
    nonce: googleNonce,
    auto_select: false,
    button_auto_select: false,
    use_fedcm_for_button: true,
    callback: (response) => activeSignIn?.(response)
  });
  initializedClientId = clientId;
}
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => { script.remove(); scriptPromise = undefined; reject(new Error("Could not load Google sign-in. Check your connection.")); };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function GoogleSignIn({ api, endpoint, mode = "login", payload = {}, onSuccess, onError, disabled = false }) {
  const container = useRef(null);
  const latest = useRef();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading Google sign-in...");
  useEffect(() => {
    latest.current = { payload, onSuccess, onError, disabled, busy };
  }, [payload, onSuccess, onError, disabled, busy]);

  useEffect(() => {
    let cancelled = false;
    let submitting = false;
    const handleCredential = async ({ credential }) => {
      if (cancelled || submitting || latest.current.disabled) return;
      submitting = true;
      setBusy(true);
      latest.current.onError?.("");
      try {
        const response = await api.post(`${endpoint}/google/${mode}`, {
          ...latest.current.payload, credential, nonce: googleNonce
        });
        if (!cancelled) latest.current.onSuccess(response.data);
      } catch (error) {
        if (!cancelled) latest.current.onError?.(error.response?.data?.message || "Google sign-in failed. Please try again.");
      } finally {
        submitting = false;
        if (!cancelled) setBusy(false);
      }
    };
    async function setup() {
      try {
        const { data } = await api.get(`${endpoint}/google/config`);
        if (cancelled) return;
        if (!data.clientId) { setStatus("Google sign-in is not configured yet."); return; }
        await loadGoogle();
        if (cancelled) return;
        initializeGoogle(data.clientId);
        activeSignIn = handleCredential;
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, {
          // Google's medium button disables personalized name/email rendering.
          theme: "outline", size: "medium", text: mode === "register" ? "signup_with" : "signin_with",
          shape: "pill", width: Math.min(container.current.offsetWidth || 300, 400)
        });
        setStatus("");
      } catch (error) { if (!cancelled) setStatus(error.message || "Google sign-in is unavailable."); }
    }
    setup();
    return () => {
      cancelled = true;
      if (activeSignIn === handleCredential) activeSignIn = undefined;
    };
  }, [api, endpoint, mode]);

  return (
    <div className="my-5">
      <div className={`flex justify-center ${disabled || busy ? "pointer-events-none opacity-50" : ""}`} aria-busy={busy}>
        <div ref={container} className="w-full flex justify-center" />
      </div>
      {(status || busy) && <p role="status" className="text-center text-xs text-slate-500 mt-2">{busy ? "Signing in..." : status}</p>}
      <div className="flex items-center gap-3 mt-5 text-xs text-slate-400"><span className="h-px bg-slate-200 flex-1" />or use email<span className="h-px bg-slate-200 flex-1" /></div>
    </div>
  );
}
