import { Select } from "./Input";

const ROLES = ["Owner", "Admin", "Sales", "Operations", "Finance", "Viewer"];

export default function DesignationField({ value = "", onChange, disabled = false }) {
  const known = ROLES.find(role => role.toLowerCase() === String(value).toLowerCase());
  return <Select label="Role in the business" value={known || ""} disabled={disabled} hint={value && !known ? "Choose Owner, Admin, Sales, Operations, Finance or Viewer to replace the previous role." : undefined} onChange={event => {
      onChange({ target: { name: "designation", value: event.target.value } });
    }}>
      <option value="">Select a role</option>
      {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
    </Select>;
}
