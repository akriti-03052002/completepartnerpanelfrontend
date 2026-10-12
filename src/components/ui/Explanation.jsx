import { ChevronDown, CircleHelp } from "lucide-react";

export default function Explanation({ title = "What does this mean?", children, className = "" }) {
  return <details className={`group ${className}`}>
    <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
      <CircleHelp size={16} aria-hidden="true" />{title}<ChevronDown size={15} aria-hidden="true" className="transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-2 space-y-3 text-sm leading-6 text-slate-600">{children}</div>
  </details>;
}
