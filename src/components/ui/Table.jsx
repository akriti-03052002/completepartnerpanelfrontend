import ListToolbar from "./ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

// Every table has a search box above it that narrows the rows by anything
// in them (names, emails, amounts, statuses, references). A column that
// sets `filter: (row) => value` also gets a pick-list of that column's
// values. Pass `searchable={false}` for a table that should have neither.
export default function Table({ columns, rows, empty = "Nothing to show yet.", searchable = true, searchPlaceholder = "Search", mobileColumns }) {
  const filters = searchable
    ? columns.filter((col) => col.filter).map((col) => ({ label: col.filterLabel || col.header, value: col.filter }))
    : [];
  const { visible, toolbar } = useListFilter(rows, filters);
  const visibleRows = searchable ? visible : rows || [];
  const hasRows = visibleRows.length > 0;

  return (
    <div>
      {searchable && <ListToolbar toolbar={toolbar} placeholder={searchPlaceholder} className="p-3 border-b border-slate-100" />}
      {mobileColumns && <div className="sm:hidden divide-y divide-slate-100">{hasRows ? visibleRows.map((row, index) => <div key={row._id || index} className="p-4 space-y-3">{columns.filter((column) => mobileColumns.includes(column.key)).map((column) => <div key={column.key} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500 shrink-0">{column.header}</span><div className="text-right min-w-0 break-words">{column.render ? column.render(row) : row[column.key]}</div></div>)}</div>) : <p className="p-6 text-sm text-slate-400">{searchable && toolbar.active ? "Nothing matches your search or filters." : empty}</p>}</div>}
      <div className={`overflow-x-auto ${mobileColumns ? "hidden sm:block" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="py-3 px-4 font-medium whitespace-nowrap">{col.header}</th>
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
                  {searchable && toolbar.active ? "Nothing matches your search or filters." : empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
