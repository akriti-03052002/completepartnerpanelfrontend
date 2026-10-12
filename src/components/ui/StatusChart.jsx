const label = value => String(value).replace(/_/g, " ");

// Horizontal bars with readable values, including keyboard/screen-reader users.
export default function StatusChart({ title, note, rows = [], empty = "No records yet.", total, totalLabel = "Total" }) {
  const values = rows.map(row => ({ ...row, value: Math.max(0, Number(row.value) || 0) }));
  const hasTotal = Number.isFinite(total) && total >= 0;
  const maximum = hasTotal ? Math.max(1, total) : Math.max(1, ...values.map(row => row.value));
  if (!values.some(row => row.value > 0)) return <section aria-label={title} className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm text-slate-500">{empty}</p></section>;
  return <section aria-label={title} className="rounded-xl border border-slate-200 p-4">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{hasTotal && <p className="text-xs text-slate-500">{totalLabel}: <strong className="text-slate-700">{total.toLocaleString("en-IN")}</strong></p>}</div>
    {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    <dl className="mt-4 space-y-3">{values.map(row => <div key={row.label}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm"><dt className="text-slate-600">{label(row.label)}</dt><dd className="font-semibold tabular-nums text-slate-900">{row.value.toLocaleString("en-IN")}{hasTotal && <span className="ml-2 text-xs font-normal text-slate-500">({Math.round(row.value / maximum * 100)}%)</span>}</dd></div>
      <div aria-hidden="true" className={`overflow-hidden bg-slate-50 ${hasTotal ? "h-8 rounded-md" : "h-2 rounded-full"}`} style={hasTotal ? { backgroundImage: "linear-gradient(to right, #e2e8f0 1px, transparent 1px)", backgroundSize: "25% 100%" } : undefined}><div className={`h-full transition-[width] duration-500 ${hasTotal ? "rounded-r-md" : "rounded-full"} ${row.color || "bg-slate-600"}`} style={{ width: `${Math.min(100, row.value / maximum * 100)}%` }} /></div>
    </div>)}</dl>
    {hasTotal && <div aria-hidden="true" className="mt-3 flex justify-between text-[11px] tabular-nums text-slate-400">{[0, .25, .5, .75, 1].map(fraction => <span key={fraction}>{Math.round(total * fraction).toLocaleString("en-IN")}</span>)}</div>}
  </section>;
}
