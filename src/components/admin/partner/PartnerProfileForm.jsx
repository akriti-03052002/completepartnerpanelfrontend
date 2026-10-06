import { useState } from "react";
import adminApi from "../../../services/adminApi";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { Input, Select } from "../../ui/Input";
import AddressFields from "../../ui/AddressFields";
import PhoneInput from "../../ui/PhoneInput";

const ENTITY_TYPES = ["proprietorship", "partnership", "llp", "private_limited", "public_limited", "individual", "other"];

const toForm = (partner) => ({
  businessName: partner.legalEntity?.businessName || "",
  legalName: partner.legalEntity?.legalName || "",
  entityType: partner.legalEntity?.entityType || "",
  website: partner.legalEntity?.website || "",
  industry: partner.legalEntity?.industry || "",
  contactName: partner.primaryContact?.name || "",
  phone: partner.primaryContact?.phone || "",
  designation: partner.primaryContact?.designation || "",
  country: partner.address?.country || "India",
  state: partner.address?.state || "",
  city: partner.address?.city || "",
  addressLine1: partner.address?.addressLine1 || "",
  addressLine2: partner.address?.addressLine2 || "",
  pincode: partner.address?.pincode || ""
});

// Admin edits the same business / contact / address fields the partner
// edits on their own Profile page (any partner type). The login email is
// deliberately not editable here.
export default function PartnerProfileForm({ partner, onSaved }) {
  const isInfluencer = partner.partnerType === "influencer";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => toForm(partner));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const startEditing = () => {
    setForm(toForm(partner));
    setError("");
    setMessage("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await adminApi.patch(`/admin/partners/${partner._id}`, form);
      setMessage(res.data.message || "Partner details saved.");
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the partner's details.");
    } finally {
      setSaving(false);
    }
  };

  const address = [partner.address?.addressLine1, partner.address?.addressLine2, partner.address?.city, partner.address?.state, partner.address?.pincode, partner.address?.country]
    .filter(Boolean).join(", ");

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-slate-900">Partner Details</h2>
        {!open && <Button variant="outline" onClick={startEditing}>Edit</Button>}
      </div>

      {message && <p role="status" className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}

      {!open ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-slate-500">{isInfluencer ? "Creator / Influencer Name" : "Business Name"}</dt><dd className="font-medium">{partner.legalEntity?.businessName || "—"}</dd></div>
          <div><dt className="text-slate-500">Legal Name</dt><dd className="font-medium">{partner.legalEntity?.legalName || "—"}</dd></div>
          <div><dt className="text-slate-500">Contact</dt><dd className="font-medium">{partner.primaryContact?.name || "—"}{partner.primaryContact?.designation ? ` (${partner.primaryContact.designation})` : ""}</dd></div>
          <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{partner.primaryContact?.phone || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-medium">{address || "—"}</dd></div>
        </dl>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={isInfluencer ? "Creator / Influencer Name" : "Business Name"} name="businessName" value={form.businessName} onChange={handleChange} />
          <Input label="Legal Name" name="legalName" value={form.legalName} onChange={handleChange} />
          <Select label="Entity Type" name="entityType" value={form.entityType} onChange={handleChange}>
            <option value="">Not specified</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </Select>
          <Input label="Industry" name="industry" value={form.industry} onChange={handleChange} />
          <Input label="Website" name="website" value={form.website} onChange={handleChange} />
          <Input label="Contact Name" name="contactName" value={form.contactName} onChange={handleChange} />
          <PhoneInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
          <AddressFields value={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />

          {error && <p role="alert" className="md:col-span-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Details</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
