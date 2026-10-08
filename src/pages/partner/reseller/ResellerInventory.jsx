import { useEffect, useState } from "react";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import Card from "../../../components/ui/Card";
import Table from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";

const TRANSACTION_LABEL = {
  purchase: "Bulk Purchase",
  allocation: "Allocation",
  release: "Release",
  adjustment: "Adjustment",
  registration: "Bundle Delivered",
  activation: "Activation",
  suspension: "Suspension",
  reactivation: "Reactivation",
  cancellation: "Cancellation"
};

export default function ResellerInventory() {
  const [inventory, setInventory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  useAutoRefresh(() => Promise.all([
    api.get("/partner/reseller/inventory").then(res => setInventory(res.data.data)),
    api.get("/partner/reseller/inventory/transactions").then(res => setTransactions(res.data.data))
  ]));

  useEffect(() => {
    Promise.all([
      api.get("/partner/reseller/inventory").then((res) => setInventory(res.data.data)),
      api.get("/partner/reseller/inventory/transactions").then((res) => setTransactions(res.data.data))
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400 text-sm p-6">Loading...</p>;

  const available = Math.max(0, (inventory?.totalPurchasedLicenses || 0) - (inventory?.totalAllocatedLicenses || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Screen Licences</h1>
        <Link to="/partner/reseller/buy"><Button>Request More Licences</Button></Link>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Stat label="Bought licences" value={inventory?.totalPurchasedLicenses || 0} highlight />
          <Stat label="Assigned to customers" value={inventory?.totalAllocatedLicenses || 0} />
          <Stat label="Active screens" value={inventory?.totalActiveScreens || 0} />
          <Stat label="Ready to assign" value={available} />
          <Stat label="Paused screens" value={inventory?.totalSuspendedScreens || 0} />
        </div>
        <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
          SPOTX bills you on <strong>bought licences</strong> every billing cycle, regardless of how many are allocated, delivered, or active.
        </p>
      </Card>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Transaction History</p>
        </div>
        <Table
          searchable
          searchPlaceholder="Search transactions"
          empty="No transactions yet."
          rows={transactions}
          columns={[
            { key: "date", header: "Date", render: (t) => new Date(t.createdAt).toLocaleDateString() },
            { key: "type", header: "Transaction", render: (t) => TRANSACTION_LABEL[t.type] || t.type, filter: (t) => TRANSACTION_LABEL[t.type] || t.type },
            { key: "quantity", header: "Quantity", render: (t) => <span className={t.quantity >= 0 ? "text-emerald-600" : "text-red-600"}>{t.quantity >= 0 ? "+" : ""}{t.quantity}</span> },
            { key: "balance", header: "Balance After", render: (t) => t.newBalance },
            { key: "reason", header: "Reason", render: (t) => <span className="text-slate-500">{t.reason || "—"}</span> }
          ]}
        />
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${highlight ? "text-brand-red" : "text-slate-900"}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
