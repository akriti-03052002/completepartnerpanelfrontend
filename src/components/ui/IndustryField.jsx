import { useState } from "react";
import { Input, Select } from "./Input";

const INDUSTRIES = ["Retail", "Hospitality", "Food & Beverage", "Healthcare", "Education", "Real Estate", "Technology", "Manufacturing", "Financial Services", "Media & Entertainment", "Transportation & Logistics", "Professional Services"];

export default function IndustryField({ value = "", onChange, disabled = false }) {
  const [otherSelected, setOtherSelected] = useState(false);
  const known = INDUSTRIES.find(industry => industry.toLowerCase() === String(value).toLowerCase());
  const isOther = otherSelected || Boolean(value && !known);
  const change = value => onChange({ target: { name: "industry", value } });
  return <div className="space-y-3">
    <Select label="Industry" value={isOther ? "__other__" : known || ""} disabled={disabled} onChange={event => {
      setOtherSelected(event.target.value === "__other__");
      change(event.target.value === "__other__" ? "" : event.target.value);
    }}>
      <option value="">Select an industry</option>
      {INDUSTRIES.map(industry => <option key={industry} value={industry}>{industry}</option>)}
      <option value="__other__">Other (please specify)</option>
    </Select>
    {isOther && <Input label="Specify your industry" name="industry" value={value || ""} onChange={onChange} disabled={disabled} required maxLength={200} placeholder="Enter your industry" hint="Your industry name will be saved in your profile." />}
  </div>;
}
