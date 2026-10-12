import { useEffect, useRef, useState } from "react";
import { Input } from "./Input";

export default function IfscField({ value = "", onChange, onBankResolved, disabled = false }) {
  const [result, setResult] = useState(null);
  const callback = useRef(onBankResolved);
  useEffect(() => { callback.current = onBankResolved; }, [onBankResolved]);
  const code = String(value).trim().toUpperCase();
  useEffect(() => {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) return;
    let active = true;
    const controller = new AbortController();
    let timeout;
    const timer = setTimeout(async () => {
      setResult({ code, loading: true });
      timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(code)}`, { signal: controller.signal, credentials: "omit" });
        if (!response.ok) throw new Error("lookup failed");
        const data = await response.json();
        if (data.IFSC !== code || !data.BANK) throw new Error("invalid lookup");
        if (active) {
          setResult({ code, bank: data.BANK, branch: data.BRANCH });
          callback.current(data.BANK, code);
        }
      } catch {
        if (active) setResult({ code, error: "Could not look up this IFSC. Check the code and enter the bank name manually." });
      } finally { clearTimeout(timeout); }
    }, 400);
    return () => { active = false; clearTimeout(timer); clearTimeout(timeout); controller.abort(); };
  }, [code]);
  const current = result?.code === code ? result : null;
  return <div>
    <Input label="IFSC code" name="ifsc" value={value || ""} disabled={disabled} required maxLength={11} pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" onChange={event => onChange({ target: { name: "ifsc", value: event.target.value.toUpperCase().replace(/\s/g, "") } })} hint="Enter the 11-character IFSC from your cheque or bank details. We will look up the bank name." />
    <p role="status" className="mt-2 text-xs text-slate-600">{current?.loading ? "Looking up bank details..." : current?.error || (current?.bank ? `${current.bank}${current.branch ? ` - ${current.branch}` : ""}. Please check these details before saving.` : "")}</p>
  </div>;
}
