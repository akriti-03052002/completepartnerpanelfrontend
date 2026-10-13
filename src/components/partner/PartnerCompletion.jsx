import { usePartnerProfile } from "../../hooks/usePartnerProfile";
import { Link } from "react-router-dom";
import { UserRound, ShieldCheck, ArrowUpRight } from "lucide-react";

function Progress({ label, value, note, icon: Icon, children, nextStep }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icon size={17} className="text-slate-400" />{label}</p><span className="text-lg font-bold tabular-nums text-slate-900">{value.percent}%</span></div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value.percent} aria-valuetext={`${value.percent}% complete`} className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full transition-[width] duration-500 ${value.percent === 100 ? "bg-emerald-500" : "bg-brand-red"}`} style={{ width: `${value.percent}%` }} /></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{note}</p><div className="flex gap-3 text-xs font-semibold text-brand-red">{children}</div></div>
    {nextStep && <NextStep step={nextStep} />}
  </div>;
}

function NextStep({ step }) {
  return <div className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-sm">{step.title}</p><p className="text-sm text-slate-500 mt-1">{step.note}</p></div>{step.allowed && <Link to={step.to} className="rounded-lg bg-brand-red text-white px-4 py-2 text-sm font-semibold">{step.action}</Link>}</div>;
}

export default function PartnerCompletion({ nextStep }) {
  const { data: profile } = usePartnerProfile();
  const data = profile?.completion;
  if (!data) return nextStep ? <div className="rounded-2xl border border-slate-200 bg-white p-5"><NextStep step={nextStep} /></div> : null;
  const verification = data.documentsAndBank;
  const showProfile = data.profile.percent < 100;
  const showVerification = verification.percent < 100;
  const profileStep = nextStep?.to === "/partner/profile" && showProfile ? nextStep : null;
  const verificationStep = ["/partner/documents", "/partner/bank"].includes(nextStep?.to) && showVerification ? nextStep : null;
  if (!showProfile && !showVerification && !nextStep) return null;
  return <section aria-label="Partner completion progress" className={`grid ${showProfile && showVerification ? "sm:grid-cols-2" : ""} gap-4 mb-6`}>
    {showProfile && <Progress label="Profile completion" icon={UserRound} value={data.profile} nextStep={profileStep} note={`${data.profile.completed} of ${data.profile.total} details filled`}>
      <Link to="/partner/profile" title={data.profile.missing.join(", ")} className="inline-flex items-center gap-1">Profile <ArrowUpRight size={13} /></Link>
    </Progress>}
    {showVerification && <Progress label="Documents & bank details" icon={ShieldCheck} value={verification} nextStep={verificationStep} note={`${verification.completed} of ${verification.total} submitted · ${verification.verified} approved`}>
      <Link to="/partner/documents">KYC</Link><Link to="/partner/bank">Bank</Link>
    </Progress>}
    {nextStep && !profileStep && !verificationStep && <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-full"><NextStep step={nextStep} /></div>}
  </section>;
}
