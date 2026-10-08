import { useState } from "react";
import { PARTNER_TYPE_COLORS } from "../../utils/partnerTypeColors";

/**
 * A horizontal bar per partner type. `rows` is
 *   [{ key, label, value, valueLabel, details: [{ label, value }] }]
 * Hovering, focusing or tapping a bar opens a small panel with its details —
 * the same figures are also listed in the sections below the charts, so
 * nothing is only reachable by hovering.
 */
export default function PartnerTypeBarChart({ title, subtitle, rows, emptyText = "Nothing to show yet." }) {
  const [activeKey, setActiveKey] = useState(null);
  const max = Math.max(...rows.map((row) => row.value), 0);
  const hasData = max > 0;

  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}

      {!hasData ? (
        <p className="text-sm text-slate-400 py-10 text-center">{emptyText}</p>
      ) : (
        <ul className="mt-5 space-y-5" onMouseLeave={() => setActiveKey(null)}>
          {rows.map((row) => {
            const percent = max > 0 ? (row.value / max) * 100 : 0;
            const active = activeKey === row.key;

            return (
              <li key={row.key} className="relative">
                <button
                  type="button"
                  className="block w-full text-left rounded-lg -mx-2 px-2 py-1.5 outline-none hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-200"
                  onMouseEnter={() => setActiveKey(row.key)}
                  onFocus={() => setActiveKey(row.key)}
                  onBlur={() => setActiveKey(null)}
                  onClick={() => setActiveKey(active ? null : row.key)}
                  aria-expanded={active}
                  aria-label={`${row.label}: ${row.valueLabel}. ${row.details.map((d) => `${d.label} ${d.value}`).join(", ")}`}
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">{row.valueLabel}</span>
                  </div>
                  {/* The track is the full scale; the bar grows from the left edge. */}
                  <div className="h-5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-5 rounded-full motion-safe:transition-[width] duration-500"
                      style={{ width: `${percent}%`, minWidth: row.value > 0 ? 3 : 0, backgroundColor: PARTNER_TYPE_COLORS[row.key], backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25))" }}
                    />
                  </div>
                </button>

                {active && (
                  <div
                    role="tooltip"
                    // Centred under the bar, so it never hides the next row's
                    // name (left) or its value (right).
                    className="absolute left-1/2 -translate-x-1/2 top-full z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg pointer-events-none"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PARTNER_TYPE_COLORS[row.key] }} />
                      <span className="text-sm font-semibold text-slate-900">{row.label}</span>
                    </div>
                    <dl className="space-y-1">
                      {row.details.map((detail) => (
                        <div key={detail.label} className="flex items-baseline justify-between gap-3">
                          <dt className="text-xs text-slate-500">{detail.label}</dt>
                          <dd className="text-sm font-semibold text-slate-900 tabular-nums">{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
