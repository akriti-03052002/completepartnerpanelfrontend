import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const DEFAULT_INPUT_CLASS =
  "w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition";

// A password field with a show / hide (eye) toggle — used for every
// password in the app. Drop-in for a plain <input type="password">:
// `className` styles the input itself (the page's own input styling, when
// it has one); pass `label` to get the standard labelled field instead.
export default function PasswordInput({ label, error, className, wrapperClassName = "", id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={wrapperClassName}>
      {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="relative">
        <input
          id={fieldId}
          {...props}
          type={visible ? "text" : "password"}
          className={`${className || DEFAULT_INPUT_CLASS} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={props.disabled ? -1 : 0}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  );
}
