import { useState } from "react";
import { searchRows } from "../utils/searchRows";

// "pending_approval" → "Pending approval"
export const optionLabel = (value) => {
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const valueOf = (filter, row) => {
  const value = filter.value(row);
  return value === null || value === undefined || value === "" ? "" : String(value);
};

/**
 * Search and filters for any list of records, used by every list in the
 * app (see ListToolbar, which draws the controls, and Table, which has
 * both built in).
 *
 * `filters` is [{ label, value: (row) => string }]. The choices offered for
 * each are the values actually present in the rows, so a filter never
 * offers something that would match nothing.
 */
export function useListFilter(rows, filters = []) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState({});
  const all = rows || [];

  const controls = filters
    .map((filter) => {
      const options = [...new Set(all.map((row) => valueOf(filter, row)).filter(Boolean))].sort();
      // A choice whose value has since left the list no longer applies.
      const value = options.includes(chosen[filter.label]) ? chosen[filter.label] : "";
      return { filter, label: filter.label, options, value };
    })
    // Nothing to choose between when every row has the same value.
    .filter((control) => control.options.length > 1);

  const filtered = all.filter((row) =>
    controls.every((control) => !control.value || valueOf(control.filter, row) === control.value));
  const visible = searchRows(filtered, query);
  const active = query.trim() !== "" || controls.some((control) => control.value);

  return {
    visible,
    toolbar: {
      query,
      onQuery: setQuery,
      filters: controls.map(({ label, options, value }) => ({
        label,
        options,
        value,
        onChange: (next) => setChosen((current) => ({ ...current, [label]: next }))
      })),
      shown: visible.length,
      total: all.length,
      active,
      onClear: () => { setQuery(""); setChosen({}); }
    }
  };
}
