import { useId } from "react";
import { COUNTRY_CODES } from "../../data/countryCodes";

const FIELD_CLASS =
  "px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white disabled:bg-slate-50";

const DEFAULT_DIAL = COUNTRY_CODES[0].dial; // India

// Longest dial code first, so "+1 684…" isn't read as "+1" + "684…".
const DIALS_BY_LENGTH = [...new Set(COUNTRY_CODES.map((c) => c.dial))].sort((a, b) => b.length - a.length);

// "+91 98765 43210" -> { dial: "+91", number: "98765 43210" }. A number
// saved without a country code keeps the default code selected.
const splitPhone = (value) => {
  const text = String(value || "").trim();
  if (text.startsWith("+")) {
    const dial = DIALS_BY_LENGTH.find((d) => text.startsWith(d));
    if (dial) return { dial, number: text.slice(dial.length).trim() };
  }
  return { dial: DEFAULT_DIAL, number: text.replace(/^\+/, "") };
};

// A phone field with a country-code picker — used for every phone /
// contact number in the app. The value is one string, "<code> <number>"
// (e.g. "+91 9876543210"), and `onChange` receives the same
// { target: { name, value } } shape as a plain input, so it drops into any
// form's existing change handler.
export default function PhoneInput({ label, name = "phone", value, onChange, required, disabled, className = "", placeholder = "XXXXX XXXXX", id }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const { dial, number } = splitPhone(value);

  const emit = (nextDial, nextNumber) => {
    const cleaned = nextNumber.replace(/[^\d\s-]/g, "");
    onChange({ target: { name, value: cleaned ? `${nextDial} ${cleaned}` : "" } });
  };

  // Two countries can share a dial code (+1), so options are keyed by name
  // and the first country with the current code is shown as selected.
  const selectedCountry = COUNTRY_CODES.find((c) => c.dial === dial) || COUNTRY_CODES[0];

  return (
    <div className={className}>
      {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="flex gap-2">
        <select
          aria-label={label ? `${label.replace(/\s*\*$/, "")} country code` : "Country code"}
          value={selectedCountry.name}
          onChange={(e) => emit(COUNTRY_CODES.find((c) => c.name === e.target.value).dial, number)}
          disabled={disabled}
          className={`${FIELD_CLASS} w-36 shrink-0`}
        >
          {COUNTRY_CODES.map((c) => <option key={`${c.name}-${c.dial}`} value={c.name}>{c.name} ({c.dial})</option>)}
        </select>
        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          name={name}
          value={number}
          onChange={(e) => emit(dial, e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${FIELD_CLASS} flex-1 min-w-0`}
        />
      </div>
    </div>
  );
}
