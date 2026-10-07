export default function Pagination({ page, pages, total, onChange }) {
  return <div className="flex items-center justify-between gap-3 p-4 text-sm">
    <span>{total} results ? Page {page} of {Math.max(1, pages)}</span>
    <div className="flex gap-3">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="disabled:opacity-40">Previous</button>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="disabled:opacity-40">Next</button>
    </div>
  </div>;
}
