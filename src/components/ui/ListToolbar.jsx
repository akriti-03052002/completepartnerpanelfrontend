import SearchBox from "./SearchBox";
import { optionLabel } from "../../hooks/useListFilter";

// The search box and filter pick-lists shown above a list. Give it the
// `toolbar` from useListFilter. Draws nothing while the list is empty.
export default function ListToolbar({ toolbar, placeholder = "Search", className = "" }) {
  if (toolbar.total === 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 ${className}`}>
      <SearchBox value={toolbar.query} onChange={toolbar.onQuery} placeholder={placeholder} className="w-full sm:w-72" />
      {toolbar.filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={`Filter by ${filter.label.toLowerCase()}`}
          className="w-full sm:w-auto px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm bg-white text-slate-700"
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}
        </select>
      ))}
      {toolbar.active && (
        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="text-xs text-slate-400 shrink-0">{toolbar.shown} of {toolbar.total}</span>
          <button type="button" onClick={toolbar.onClear} className="text-xs font-semibold text-brand-red hover:underline shrink-0">Clear</button>
        </div>
      )}
    </div>
  );
}
