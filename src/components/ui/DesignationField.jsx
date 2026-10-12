import { useState } from "react";
import { Input, Select } from "./Input";

const ROLES = ["Owner", "Director", "Manager", "Sales", "Finance", "Operations", "Marketing", "Administrator"];

export default function DesignationField({ value = "", onChange, disabled = false }) {
  const [otherSelected, setOtherSelected] = useState(false);
  const known = ROLES.find(role => role.toLowerCase() === String(value).toLowerCase());
  const isOther = otherSelected || Boolean(value && !known);
  return <div className="space-y-3">
    <Select label="Role in the business" value={isOther ? "__other__" : known || ""} disabled={disabled} hint="Account access is managed separately through team permissions." onChange={event => {
      setOtherSelected(event.target.value === "__other__");
      onChange({ target: { name: "designation", value: event.target.value === "__other__" ? "" : event.target.value } });
    }}>
      <option value="">Select a role</option>
      {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
      <option value="__other__">Other (please specify)</option>
    </Select>
    {isOther && <Input label="Specify your role" name="designation" value={value || ""} onChange={onChange} disabled={disabled} required maxLength={100} placeholder="Enter your role in the business" />}
  </div>;
}
