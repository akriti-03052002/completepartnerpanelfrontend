import { useId } from "react";

// The label is tied to its field (htmlFor/id), so clicking it focuses the
// field and screen readers announce it.
export function Input({ label, error, hint, className = "", id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className={className}>
      {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
        {...props}
      />
      {hint && !error && <p id={`${fieldId}-hint`} className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p id={`${fieldId}-error`} role="alert" className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, hint, className = "", children, id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className={className}>
      {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white"
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p id={`${fieldId}-hint`} className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p id={`${fieldId}-error`} role="alert" className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  );
}
