import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import customerApi from "../services/customerApi";
import CustomerRegister from "./CustomerRegister";
import ResellerRegister from "./ResellerCustomerReferralRegister";
import Logo from "../components/ui/Logo";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function UnifiedCustomerRegister() {
  const [params, setParams] = useSearchParams();
  const code = params.get("ref") || "";
  const [enteredCode, setEnteredCode] = useState(code);
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(code));
  useEffect(() => {
    if (!code) return;
    let active = true;
    customerApi.get(`/public/customers/unified/referral/${encodeURIComponent(code)}`)
      .then(res => { if (active) { setPartner({ ...res.data.data, code }); setError(""); } })
      .catch(err => { if (active) setError(err.response?.data?.message || "Could not check your code. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code]);
  if (partner?.code === code) return <div><div className="border-b border-slate-200 bg-white p-4 text-center text-sm text-slate-700">Registering with <strong>{partner.businessName}</strong> ({partner.customerType === "reseller" ? "Reseller" : "Vendor"}) <button type="button" className="ml-3 font-semibold underline" onClick={() => { setPartner(null); setError(""); setParams({}); }}>Change referral code</button></div>{partner.customerType === "reseller" ? <ResellerRegister key={code} /> : <CustomerRegister key={code} />}</div>;
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4"><Logo size="sm" /><h1 className="text-2xl font-bold">Create your customer account</h1><p className="text-sm text-slate-600">Enter the referral code from your vendor or reseller. We will select the right registration form for you.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<form className="space-y-4" onSubmit={event => { event.preventDefault(); const value = enteredCode.trim(); if (!value) return; setError(""); setLoading(true); if (value === code) customerApi.get(`/public/customers/unified/referral/${encodeURIComponent(value)}`).then(res => setPartner({ ...res.data.data, code: value })).catch(err => setError(err.response?.data?.message || "Could not check your code.")).finally(() => setLoading(false)); else setParams({ ref: value }); }}><Input label="Partner referral code" value={enteredCode} onChange={event => setEnteredCode(event.target.value)} required maxLength={100} /><Button type="submit" loading={loading}>Continue</Button></form><p className="text-sm text-slate-600">Already registered? <Link to="/customer/login" className="font-semibold underline">Sign in</Link></p></div></main>;
}
