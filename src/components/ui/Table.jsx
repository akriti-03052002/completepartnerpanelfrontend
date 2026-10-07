import ListToolbar from "./ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

// Every table has a search box above it that narrows the rows by anything
// in them (names, emails, amounts, statuses, references). A column that
// sets `filter: (row) => value` also gets a pick-list of that column's
// values. Pass `searchable={false}` for a table that should have neither.
export default function Table({ columns, rows, empty = "Nothing to show yet.", searchable = true, searchPlaceholder = "Search", emptyAction, mobileColumns }) {
  const cardColumns = mobileColumns || columns.map((column) => column.key);
  const filters = searchable
    ? columns.filter((col) => col.filter).map((col) => ({ label: col.filterLabel || col.header, value: col.filter }))
    : [];
  const { visible, toolbar } = useListFilter(rows, filters, `table:${columns.map((column) => column.key).join(",")}`);
  const visibleRows = searchable ? visible : rows || [];
  const hasRows = visibleRows.length > 0;

  return (
    <div>
      {searchable && <ListToolbar toolbar={toolbar} placeholder={searchPlaceholder} className="p-3 border-b border-slate-100" />}
      {cardColumns && <div className="sm:hidden divide-y divide-slate-100">{hasRows ? visibleRows.map((row, index) => <div key={row._id || index} className="p-4 space-y-3">{columns.filter((column) => cardColumns.includes(column.key)).map((column) => <div key={column.key} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500 shrink-0">{column.header}</span><div className="text-right min-w-0 break-words flex-1">{column.render ? column.render(row) : row[column.key]}</div></div>)}</div>) : <div className="p-6 text-sm text-slate-400">{searchable && toolbar.active ? <><p>Nothing matches your search or filters.</p><button type="button" onClick={toolbar.onClear} className="mt-3 text-brand-red font-semibold hover:underline">Reset search and filters</button></> : <>{empty}{emptyAction && <div className="mt-3">{emptyAction}</div>}</>}</div>}</div>}
      <div tabIndex={0} role="region" aria-label="Results table. Scroll sideways to see more columns." className={`overflow-x-auto rounded-lg focus-visible:ring-2 focus-visible:ring-slate-400 ${cardColumns ? "hidden sm:block" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {columns.map((col) => (
                <th scope="col" key={col.key} className="py-3 px-4 font-medium whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              visibleRows.map((row, i) => (
                <tr key={row._id || row.id || i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-slate-400 text-sm">
                  {searchable && toolbar.active ? <><p>Nothing matches your search or filters.</p><button type="button" onClick={toolbar.onClear} className="mt-3 text-brand-red font-semibold hover:underline">Reset search and filters</button></> : <>{empty}{emptyAction && <div className="mt-3">{emptyAction}</div>}</>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
