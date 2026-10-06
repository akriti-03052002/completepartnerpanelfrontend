import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { CommissionAmount } from "../../components/ui/FinancialAmount";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function Commissions() {
  const { partner } = usePartnerAuth();
  const partnerType = partner?.partnerType?.toLowerCase();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/partner/commissions").then((res) => setCommissions(res.data.data)).finally(() => setLoading(false));
  }, []);

  // Kept live, so a newly earned or approved item appears on its own.
  useAutoRefresh(() => {
    api.get("/partner/commissions").then((res) => setCommissions(res.data.data)).catch(() => {});
  });

  const columns = [
    ...(partnerType === "vendor"
      ? [{ key: "customer", header: "Customer", render: (r) => r.customerId?.companyName || "—" }]
      : partnerType === "affiliate"
        ? [{ key: "deal", header: "Deal", render: (r) => r.referralId?.customer?.companyName || "—" }]
        : []),
    { key: "type", header: "Type", render: (r) => <Badge tone="neutral">{r.calculation?.commissionType?.replace(/_/g, " ") || "Earning"}</Badge>, filter: (r) => r.calculation?.commissionType },
    { key: "revenue", header: "Revenue", render: (r) => `₹${(r.transaction?.revenue || 0).toLocaleString("en-IN")}` },
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

      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
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
