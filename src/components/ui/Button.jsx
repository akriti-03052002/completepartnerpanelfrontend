const VARIANTS = {
  primary: "bg-brand-black text-white hover:bg-charcoal",
  danger: "bg-brand-red text-white hover:opacity-90",
  outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100"
};

export default function Button({ variant = "primary", loading = false, className = "", children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      aria-busy={loading || undefined}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin shrink-0" />}
      {children}
      {loading && <span className="sr-only">In progress</span>}
    </button>
  );
}
