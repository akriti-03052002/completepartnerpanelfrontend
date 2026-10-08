import { useState } from "react";
import adminApi from "../../../services/adminApi";
import { Input, Select } from "../../ui/Input";
import Button from "../../ui/Button";

export default function AdminBankEntry({ partnerId, onSaved }) {
  const [form, setForm] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifsc: "", accountType: "savings" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const save = async e => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await adminApi.put(`/admin/partners/${partnerId}/bank`, form);
      setForm(prev => ({ ...prev, accountNumber: "", ifsc: "" }));
      onSaved();
    } catch (err) { setError(err.response?.data?.message || "Could not save bank details."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-3 mt-4">
    <p className="text-sm text-slate-500">Enter bank details on behalf of the partner. They will need verification after saving.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input label="Account holder" name="accountHolderName" value={form.accountHolderName} onChange={change} required />
      <Input label="Bank name" name="bankName" value={form.bankName} onChange={change} required />
      <Input label="Account number" name="accountNumber" inputMode="numeric" value={form.accountNumber} onChange={change} required />
      <Input label="IFSC" name="ifsc" value={form.ifsc} onChange={change} required />
      <Select label="Account type" name="accountType" value={form.accountType} onChange={change}>
        <option value="savings">Savings</option><option value="current">Current</option><option value="other">Other</option>
      </Select>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <Button type="submit" loading={busy}>Save bank details</Button>
  </form>;
}
