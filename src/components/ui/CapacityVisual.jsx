export default function CapacityVisual({ title, used, capacity, usedLabel, note }) {
  const amount = Math.max(0, Number(used) || 0);
  const limit = Math.max(0, Number(capacity) || 0);
  const percent = limit > 0 ? Math.min(100, amount / limit * 100) : 0;
  return <section aria-label={title} className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
    <div aria-hidden="true" className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#2563eb ${percent}%, #e2e8f0 0)` }}>
      <div className="flex h-21 w-21 flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-bold text-slate-900">{Math.round(percent)}%</span><span className="text-xs text-slate-500">of allowance</span></div>
    </div>
    <div className="min-w-0 flex-1"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-700"><strong>{amount.toLocaleString("en-IN")}</strong> {usedLabel} / <strong>{limit.toLocaleString("en-IN")}</strong> allowed</p><p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></div>
  </section>;
}
