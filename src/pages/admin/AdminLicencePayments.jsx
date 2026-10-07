import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import SearchBox from "../../components/ui/SearchBox";
import AdminResellerReceivables from "./AdminResellerReceivables";

const STATUSES = ["all", "pending", "due_week", "overdue", "paid", "failed"];
const DURATIONS = [
  { key: "all", label: "All time" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "365d", label: "Last year" }
];

// Money coming IN from Resellers: the invoices SPOTX raises for the licences
// they bought, and what has been paid against them. This is the opposite
// direction to Commission and Settlement, which are what SPOTX pays out to
// Influencers, Affiliates and Vendors.
export default function AdminLicencePayments() {
  const [resellers, setResellers] = useState([]);
  const [partnerId, setPartnerId] = useState("");
  const [status, setStatus] = useState("all");
  const [duration, setDuration] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.get("/admin/partners", { params: { partnerType: "reseller" } })
      .then((res) => setResellers(res.data.data))
      .catch(() => setResellers([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reseller bills & payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          What Resellers pay SPOTX for the licences they buy. Record an offline payment or switch an invoice to online payment here.
        </p>
      </div>

      <div aria-label="Quick bill filters" className="flex flex-wrap gap-2">{[["all", "All bills"], ["due_week", "Due in next 7 days"], ["overdue", "Overdue"], ["paid", "Paid"]].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold border ${status === value ? "bg-brand-black text-white border-brand-black" : "bg-white text-slate-700 border-slate-200"}`}>{label}</button>)}{(partnerId || search || duration !== "all") && <button type="button" onClick={() => { setPartnerId(""); setStatus("all"); setSearch(""); setDuration("all"); }} className="px-3 py-2 text-sm text-brand-red font-semibold">Reset filters</button>}</div>
      <Card className="p-4 flex flex-col lg:flex-row gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by invoice number or reseller" className="flex-1" />
        <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="lg:w-60" aria-label="Reseller">
          <option value="">All resellers</option>
          {resellers.map((p) => <option key={p._id} value={p._id}>{p.legalEntity?.businessName || p.partnerCode}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-44" aria-label="Payment status">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All bills" : s === "due_week" ? "Due in next 7 days" : s[0].toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={duration} onChange={(e) => setDuration(e.target.value)} className="lg:w-44" aria-label="Period">
          {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </Select>
      </Card>

      <AdminResellerReceivables partnerId={partnerId} status={status} duration={duration} search={search} />
    </div>
  );
}
