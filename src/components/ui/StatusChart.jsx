const label = value => String(value).replace(/_/g, " ");

// Horizontal bars with readable values, including keyboard/screen-reader users.
export default function StatusChart({ title, note, rows = [], empty = "No records yet." }) {
  const values = rows.map(row => ({ ...row, value: Math.max(0, Number(row.value) || 0) }));
  const maximum = Math.max(1, ...values.map(row => row.value));
  if (!values.some(row => row.value > 0)) return <section aria-label={title} className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm text-slate-500">{empty}</p></section>;
  return <section aria-label={title} className="rounded-xl border border-slate-200 p-4">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    <dl className="mt-4 space-y-3">{values.map(row => <div key={row.label}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm"><dt className="capitalize text-slate-600">{label(row.label)}</dt><dd className="font-semibold tabular-nums text-slate-900">{row.value.toLocaleString("en-IN")}</dd></div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-600" style={{ width: `${row.value / maximum * 100}%` }} /></div>
    </div>)}</dl>
  </section>;
}
