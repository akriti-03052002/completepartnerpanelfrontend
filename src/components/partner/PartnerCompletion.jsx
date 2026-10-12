import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, ShieldCheck, ArrowUpRight } from "lucide-react";
import api from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

function Progress({ label, value, note, icon: Icon, children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icon size={17} className="text-slate-400" />{label}</p><span className="text-lg font-bold tabular-nums text-slate-900">{value.percent}%</span></div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value.percent} aria-valuetext={`${value.percent}% complete`} className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full transition-[width] duration-500 ${value.percent === 100 ? "bg-emerald-500" : "bg-brand-red"}`} style={{ width: `${value.percent}%` }} /></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{note}</p><div className="flex gap-3 text-xs font-semibold text-brand-red">{children}</div></div>
  </div>;
}

export default function PartnerCompletion() {
  const [data, setData] = useState(null);
  const load = useCallback(async (signal) => {
    if (!localStorage.getItem("partnerToken")) return;
    const response = await api.get("/partner/profile", { signal });
    if (!signal?.aborted) setData(response.data.data.completion);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api.get("/partner/profile", { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) setData(response.data.data.completion);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  useAutoRefresh(() => load());
  if (!data) return null;
  const verification = data.documentsAndBank;
  const showProfile = data.profile.percent < 100;
  const showVerification = verification.percent < 100;
  if (!showProfile && !showVerification) return null;
  return <section aria-label="Partner completion progress" className={`grid ${showProfile && showVerification ? "sm:grid-cols-2" : ""} gap-4 mb-6`}>
    {showProfile && <Progress label="Profile completion" icon={UserRound} value={data.profile} note={`${data.profile.completed} of ${data.profile.total} details filled`}>
      <Link to="/partner/profile" title={data.profile.missing.join(", ")} className="inline-flex items-center gap-1">Profile <ArrowUpRight size={13} /></Link>
    </Progress>}
    {showVerification && <Progress label="Documents & bank details" icon={ShieldCheck} value={verification} note={`${verification.completed} of ${verification.total} submitted · ${verification.verified} approved`}>
      <Link to="/partner/documents">KYC</Link><Link to="/partner/bank">Bank</Link>
    </Progress>}
  </section>;
}
