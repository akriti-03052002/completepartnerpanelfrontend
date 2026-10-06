import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Country, State } from "country-state-city";
import { Input, Select } from "./Input";
import { CITIES_BY_STATE } from "../../data/indiaCitiesByState";

// India first since it's the default and the only one with pincode auto-fill.
const ALL_COUNTRIES = (() => {
  const all = Country.getAllCountries();
  const india = all.find((c) => c.name === "India");
  const rest = all.filter((c) => c.name !== "India").sort((a, b) => a.name.localeCompare(b.name));
  return india ? [india, ...rest] : all;
})();

// The address block used wherever an address is entered: country and
// state / province are picked from a list, city is picked from a list for
// India (or typed), and a 6-digit Indian pincode fills in state + city.
// Same behaviour as the partner's own Profile page.
//
// `value` holds { country, state, city, addressLine1, addressLine2, pincode };
// `onChange` receives just the fields that changed, to merge into the form.
export default function AddressFields({ value, onChange, disabled = false }) {
  const country = value.country || "India";
  const [pincodeStatus, setPincodeStatus] = useState(""); // "" | "loading" | "found" | "not-found"
  const [pincodeTouched, setPincodeTouched] = useState(false); // only look up once it's edited, not on load
  const [cityOptions, setCityOptions] = useState([]); // localities for the entered pincode (take priority)
  const [cityIsCustom, setCityIsCustom] = useState(false); // typing a city that isn't in the menu

  const cityMenuOptions = cityOptions.length > 0 ? cityOptions : (CITIES_BY_STATE[value.state] || []);

  // Some small countries have no subdivisions in the dataset — the State
  // field falls back to free text for those.
  const statesForCountry = useMemo(() => {
    const match = ALL_COUNTRIES.find((c) => c.name === country);
    return match ? State.getStatesOfCountry(match.isoCode) : [];
  }, [country]);

  // India Post's public pincode API — no key needed, and only meaningful
  // for India; other countries' postal codes are free text.
  useEffect(() => {
    if (!pincodeTouched || country !== "India") return undefined;

    const pincode = String(value.pincode || "").trim();
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      if (!/^\d{6}$/.test(pincode)) {
        setPincodeStatus("");
        setCityOptions([]);
        return;
      }

      setPincodeStatus("loading");

      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        const offices = data?.[0]?.Status === "Success" ? data[0].PostOffice : null;

        if (cancelled) return;

        if (offices && offices.length > 0) {
          // Several localities can share one pincode — offer them as a
          // menu instead of guessing which one is the right city.
          const localities = [...new Set(offices.map((o) => o.Name).filter(Boolean))];

          setCityOptions(localities);
          setCityIsCustom(false);
          onChange({
            state: offices[0].State || value.state,
            city: localities.includes(value.city) ? value.city : (offices[0].District || localities[0] || value.city)
          });
          setPincodeStatus("found");
        } else {
          setCityOptions([]);
          setPincodeStatus("not-found");
        }
      } catch {
        if (!cancelled) {
          setCityOptions([]);
          setPincodeStatus("not-found");
        }
      }
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [value.pincode, country, pincodeTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <>
      <Input label="Address Line 1" value={value.addressLine1 || ""} onChange={set("addressLine1")} placeholder="Street address" disabled={disabled} />
      <Input label="Address Line 2" value={value.addressLine2 || ""} onChange={set("addressLine2")} placeholder="Building / Area / Landmark" disabled={disabled} />

      <Select
        label="Country"
        value={country}
        onChange={(e) => {
          // A different country has a different state list.
          onChange({ country: e.target.value, state: "" });
          setCityIsCustom(false);
          setCityOptions([]);
          setPincodeStatus("");
        }}
        disabled={disabled}
      >
        {ALL_COUNTRIES.map((c) => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
      </Select>

      {statesForCountry.length > 0 ? (
        <Select
          label="State / Province"
          value={value.state || ""}
          onChange={(e) => { onChange({ state: e.target.value }); setCityIsCustom(false); }}
          disabled={disabled}
        >
          <option value="">Select state</option>
          {/* A saved state that isn't in the list is kept selectable rather than silently dropped. */}
          {value.state && !statesForCountry.some((s) => s.name === value.state) && <option value={value.state}>{value.state}</option>}
          {statesForCountry.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
        </Select>
      ) : (
        <Input label="State / Province" value={value.state || ""} onChange={set("state")} disabled={disabled} />
      )}

      <div>
        {country === "India" && cityMenuOptions.length > 0 && !cityIsCustom ? (
          <Select
            label="City"
            value={value.city || ""}
            onChange={(e) => {
              if (e.target.value === "__other__") {
                setCityIsCustom(true);
                onChange({ city: "" });
              } else {
                onChange({ city: e.target.value });
              }
            }}
            disabled={disabled}
          >
            <option value="">Select city</option>
            {value.city && !cityMenuOptions.includes(value.city) && <option value={value.city}>{value.city}</option>}
            {cityMenuOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__other__">Other (type manually)</option>
          </Select>
        ) : (
          <div>
            <Input label="City" value={value.city || ""} onChange={set("city")} disabled={disabled} />
            {cityMenuOptions.length > 0 && !disabled && (
              <button type="button" onClick={() => setCityIsCustom(false)} className="text-xs text-brand-red font-medium mt-1 hover:underline">
                Choose from list instead
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="relative">
          <Input
            label={country === "India" ? "Pincode" : "Postal / ZIP Code"}
            value={value.pincode || ""}
            onChange={(e) => { setPincodeTouched(true); onChange({ pincode: e.target.value }); }}
            maxLength={country === "India" ? 6 : 12}
            inputMode={country === "India" ? "numeric" : "text"}
            placeholder={country === "India" ? "6-digit pincode" : "Postal / ZIP code"}
            disabled={disabled}
          />
          {pincodeStatus === "loading" && (
            <Loader2 size={16} className="absolute right-3 bottom-3.5 text-slate-400 animate-spin" />
          )}
        </div>
        {pincodeStatus === "found" && <p className="text-xs text-green-600 mt-1">State and city filled in from the pincode.</p>}
        {pincodeStatus === "not-found" && <p className="text-xs text-slate-400 mt-1">Couldn&apos;t find that pincode — enter the state and city yourself.</p>}
      </div>
    </>
  );
}
