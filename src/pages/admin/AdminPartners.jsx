import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Select, Input } from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import SearchBox from "../../components/ui/SearchBox";

const STATUSES = ["", "draft", "pending_verification", "under_review", "active", "suspended", "rejected", "inactive"];
const PARTNER_TYPES = ["vendor", "affiliate", "influencer", "reseller"];

// Only the fields needed to invite someone in — business name, legal
// details, address, KYC docs and bank all get filled in later by the
// partner themselves from their Profile page.
const TYPE_TITLES = { influencer: "Influencers", affiliate: "Affiliates", vendor: "Vendors", reseller: "Resellers" };

const EMPTY_FORM = { partnerType: "vendor", contactName: "", email: "", phone: "" };

export default function AdminPartners() {
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const verificationStatus = searchParams.get("verificationStatus") || "";
  const partnerType = searchParams.get("partnerType") || "";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, isLoading: loading, error: listError, refetch: load } = useQuery({
    queryKey: ["admin", "partners", status, verificationStatus, partnerType, debouncedSearch, page],
    queryFn: () => adminApi.get("/admin/partners", {
      params: { status: status || undefined, verificationStatus: verificationStatus || undefined, partnerType: partnerType || undefined, search: debouncedSearch || undefined, page, limit: 25 }
    }).then((res) => res.data)
  });
  const visiblePartners = data?.data || [];

  const [resendingId, setResendingId] = useState(null);
  const resendInvitation = async (id) => {
    setResendingId(id);
    try {
      const res = await adminApi.post(`/admin/partners/${id}/resend-invitation`);
      setSuccessMessage(res.data.message);
    } catch (err) { setSuccessMessage(err.response?.data?.message || "Could not resend invitation."); }
    finally { setResendingId(null); }
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePartnerTypeChange = (e) => {
    const nextType = e.target.value;
    setPage(1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextType) next.set("partnerType", nextType);
      else next.delete("partnerType");
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const res = await adminApi.post("/admin/partners", form);
      setSuccessMessage(res.data.message);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong creating the partner.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{TYPE_TITLES[partnerType] || "All Partners"}</h1>
        {/* A partner of any type is created from All Partners only — a
            type's own list is for finding and opening its partners. */}
        {!partnerType && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <span className="flex items-center gap-2"><Plus size={16} /> Create Partner</span>
          </Button>
        )}
      </div>

      {successMessage && (
        <Card className="p-5 border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-800">{successMessage}</p>
          <button type="button" onClick={() => setSuccessMessage("")} className="text-xs text-emerald-700 hover:underline mt-2">
            Dismiss
          </button>
        </Card>
      )}

      {showForm && !partnerType && (
        <Card className="p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <p className="text-sm text-slate-500 mb-4">
            The partner receives an email link to set their password. Business details, address and KYC come later from their Profile.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Partner Type" name="partnerType" value={form.partnerType} onChange={handleChange}>
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </Select>
              <Input label="Full Name *" name="contactName" value={form.contactName} onChange={handleChange} required />
              <Input label="Email *" type="email" name="email" value={form.email} onChange={handleChange} required />
              <PhoneInput label="Phone *" name="phone" value={form.phone} onChange={handleChange} required />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={submitting}>Create Partner</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <SearchBox placeholder="Search by name, business, email, phone or code" value={search} onChange={setSearch} className="flex-1" />
        <Select value={status} onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) next.set("status", e.target.value);
          else next.delete("status");
          setSearchParams(next);
          setPage(1);
        }} className="sm:w-56">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
        </Select>
        <Select value={verificationStatus} onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) next.set("verificationStatus", e.target.value);
          else next.delete("verificationStatus");
          setSearchParams(next);
          setPage(1);
        }} className="sm:w-56">
          <option value="">All verification statuses</option>
          <option value="verified">Verified</option>
        </Select>
        <Select value={partnerType} onChange={handlePartnerTypeChange} className="sm:w-56">
          <option value="">All partner types</option>
          {PARTNER_TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
        </Select>
      </Card>

      <Card>
        {listError ? (
          <div className="p-6 text-sm text-red-700">Could not load partners. <Button variant="outline" onClick={() => load()}>Retry</Button></div>
        ) : loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
          <Table
            searchable={false}
            empty="No partners found."
            rows={visiblePartners}
            columns={[
              { key: "code", header: "Code", render: (p) => p.partnerCode },
              {
                key: "name",
                header: "Partner",
                render: (p) => <div><p className="font-medium">{p.primaryContact?.name || p.legalEntity?.businessName || p.partnerCode}</p><p className="text-xs text-slate-500">{p.legalEntity?.businessName || "Business profile incomplete"}</p><p className="text-xs text-slate-500">{p.primaryContact?.email}</p></div>
              },
              { key: "type", header: "Type", render: (p) => <Badge tone="neutral">{p.partnerType}</Badge> },
              { key: "status", header: "Status", render: (p) => <Badge status={p.status} /> },
              { key: "verification", header: "Verification", render: (p) => <Badge status={p.verification.overallStatus} /> },
              { key: "actions", header: "", render: (p) => <div className="flex flex-col gap-2"><Link to={`/admin/partners/${p._id}`} className="text-xs font-semibold text-brand-red hover:underline">View</Link>{p.invitationPending && <button type="button" disabled={resendingId === p._id} onClick={() => resendInvitation(p._id)} className="text-xs text-brand-red disabled:opacity-50">{resendingId === p._id ? "Sending..." : "Resend setup email"}</button>}</div> }
            ]}
          />
        )}
        {data?.pagination && !listError && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Page {page} of {Math.max(1, data.pagination.pages)} · {data.pagination.total} partners</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" disabled={page >= data.pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
