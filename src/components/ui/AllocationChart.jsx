import { statusLabel } from "../../utils/statusLabel";
const COLOURS = ["#10b981", "#3b82f6", "#f59e0b", "#f87171", "#8b5cf6", "#64748b"];
const STATUS_COLOURS = { "bg-emerald-500": "#10b981", "bg-blue-500": "#3b82f6", "bg-amber-400": "#fbbf24", "bg-red-400": "#f87171" };

export default function AllocationChart({ title, note, rows = [], total = 0, totalLabel = "Total" }) {
  const values = rows.map(row => ({ ...row, value: Math.max(0, Number(row.value) || 0) }));
  const colour = (row, index) => STATUS_COLOURS[row.color] || COLOURS[index % COLOURS.length];
  let end = 0;
  const slices = values.map((row, index) => {
    const start = end;
    end = Math.min(100, end + (total > 0 ? row.value / total * 100 : 0));
    return `${colour(row, index)} ${start}% ${end}%`;
  });
  const description = values.map(row => `${statusLabel(row.label)}: ${row.value.toLocaleString("en-IN")}`).join(", ");
  return <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <div className="mt-5 grid items-center gap-6 sm:grid-cols-[220px_1fr]">
      <div role="img" aria-label={`${totalLabel}: ${total.toLocaleString("en-IN")}. ${description}`} className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full" style={{ background: total > 0 ? `conic-gradient(${slices.join(", ")}${end < 100 ? `, #f1f5f9 ${end}% 100%` : ""})` : "#f1f5f9" }}>
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-bold tabular-nums text-slate-900">{total.toLocaleString("en-IN")}</span><span className="text-xs text-slate-500 mt-1">{totalLabel}</span></div>
      </div>
      <dl className="space-y-3">{values.map((row, index) => <div key={row.label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: colour(row, index) }} />
        <dt className="flex-1 text-sm text-slate-600">{statusLabel(row.label)}</dt>
        <dd className="text-right"><span className="block text-lg font-bold tabular-nums text-slate-900">{row.value.toLocaleString("en-IN")}</span><span className="text-xs text-slate-500">{total > 0 ? Math.round(row.value / total * 100) : 0}%</span></dd>
      </div>)}</dl>
    </div>
    {note && <p className="mt-5 text-xs leading-relaxed text-slate-500">{note}</p>}
  </section>;
}
