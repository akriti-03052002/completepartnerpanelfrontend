import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { CommissionAmount } from "../../components/ui/FinancialAmount";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function Commissions() {
  const { partner, hasPermission } = usePartnerAuth();
  const partnerType = partner?.partnerType?.toLowerCase();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const fetchCommissions = () => api.get("/partner/commissions")
    .then((res) => { setCommissions(res.data.data); setError(""); })
    .catch((err) => setError(err.response?.data?.message || "Could not load your earnings. Please try again."))
    .finally(() => setLoading(false));
  useEffect(() => { fetchCommissions(); }, []);

  // Kept live, so a newly earned or approved item appears on its own.
  useAutoRefresh(fetchCommissions);

  const columns = [
    ...(partnerType === "vendor"
      ? [{ key: "customer", header: "Customer", render: (r) => r.customerId?.companyName || "—" }]
      : partnerType === "affiliate"
        ? [{ key: "deal", header: "Deal", render: (r) => r.referralId?.customer?.companyName || "—" }]
        : []),
    { key: "type", header: "Type", render: (r) => <Badge tone="neutral">{r.calculation?.commissionType?.replace(/_/g, " ") || "Earning"}</Badge>, filter: (r) => r.calculation?.commissionType },
    { key: "revenue", header: partnerType === "vendor" ? "Customer payment basis" : "Revenue", render: (r) => `₹${(r.transaction?.revenue || 0).toLocaleString("en-IN")}` },
    { key: "net", header: partnerType === "affiliate" ? "Reward breakdown" : partnerType === "influencer" ? "Content payment breakdown" : "Commission breakdown", render: (r) => <CommissionAmount commission={r} currency={r.transaction?.currency || "INR"} /> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.settlement?.status || "unknown"} />, filter: (r) => r.settlement?.status || "unknown" },
    { key: "date", header: "Earned", render: (r) => new Date(r.createdAt).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {partnerType === "affiliate"
          ? "Referral Rewards"
          : partnerType === "vendor"
            ? "Customer Commissions"
            : partnerType === "influencer"
              ? "Content Earnings"
              : "Commissions"}
      </h1>

      {partnerType === "vendor" && <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">How to read your commission</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm leading-6 text-slate-600">
          <li><strong>Customer payment basis</strong> is the recorded amount used for the calculation. It is separate from your earnings.</li>
          <li><strong>Commission before deductions</strong> comes from your individual agreed rate or fixed amount. Percentage commissions show the payment basis multiplied by your rate.</li>
          <li><strong>Your earnings</strong> are the commission after recorded deductions. The payment status shows whether this amount has been settled.</li>
        </ol>
        <p className="text-sm text-slate-600">One-time commission applies to the qualifying first payment. Recurring commission applies to qualifying repeat payments under your agreement.</p>
        {hasPermission("settlements:view") && <Link to="/partner/settlements" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Check payments to you</Link>}
      </Card>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button type="button" onClick={fetchCommissions} className="font-semibold underline">Try again</button>{commissions.length > 0 && <p className="mt-1">Showing previously loaded earnings until the refresh succeeds.</p>}</div>}
      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : error && !commissions.length ? null : (
          <Table
            searchable
            searchPlaceholder="Search by customer, lead, amount or status"
            empty={partnerType === "affiliate" ? "No referral rewards yet." : "No commissions earned yet."}
            rows={commissions}
            columns={columns}
          />
        )}
      </Card>
    </div>
  );
}
