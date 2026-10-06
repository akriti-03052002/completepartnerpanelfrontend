import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Building2, PackageSearch, Receipt } from "lucide-react";
import api from "../../../services/api";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

// Reseller-specific dashboard — SPOTX bills this partner on total
// purchased licenses only, never active/allocated usage, so the
// "Purchased" figure is called out explicitly as the billed quantity
//.
export default function ResellerDashboard() {
  const [inventory, setInventory] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/partner/reseller/inventory").then((res) => setInventory(res.data.data)),
      api.get("/partner/reseller/customers").then((res) => setCustomers(res.data.data)),
      api.get("/partner/reseller/invoices").then((res) => setInvoices(res.data.data))
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400 text-sm p-6">Loading...</p>;

  const available = Math.max(0, (inventory?.totalPurchasedLicenses || 0) - (inventory?.totalAllocatedLicenses || 0));
  const currentInvoice = invoices.find((i) => i.paymentStatus !== "paid");
  const lastPaid = invoices.find((i) => i.paymentStatus === "paid");

  const customerCounts = customers.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reseller Dashboard</h1>

      <Card className="p-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          License Inventory <span className="normal-case font-normal text-slate-400">— Purchased is what SPOTX bills you on</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stat label="Purchased" value={inventory?.totalPurchasedLicenses || 0} highlight />
          <Stat label="Allocated" value={inventory?.totalAllocatedLicenses || 0} />
          <Stat label="Available" value={available} />
          <Stat label="Registered" value={inventory?.totalRegisteredScreens || 0} />
          <Stat label="Active" value={inventory?.totalActiveScreens || 0} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Total" value={customers.length} />
            <Stat label="Active" value={customerCounts.active || 0} />
            <Stat label="Pending" value={(customerCounts.pending || 0) + (customerCounts.allocated || 0) + (customerCounts.pending_activation || 0)} />
            <Stat label="Suspended" value={customerCounts.suspended || 0} />
            <Stat label="Cancelled" value={customerCounts.cancelled || 0} />
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Billing</p>
          {currentInvoice ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Current invoice</span>
                <Badge status={currentInvoice.paymentStatus} />
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{currentInvoice.total.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400">Due {new Date(currentInvoice.dueDate).toLocaleDateString()} · {currentInvoice.billingCycle}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No outstanding invoice.</p>
          )}
          {lastPaid && (
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Last paid: ₹{lastPaid.total.toLocaleString("en-IN")} on {new Date(lastPaid.paidAt).toLocaleDateString()}
            </p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/partner/reseller/buy"><Button><span className="flex items-center gap-2"><ShoppingCart size={16} /> Buy Software Licenses</span></Button></Link>
          <Link to="/partner/reseller/customers"><Button variant="outline"><span className="flex items-center gap-2"><Building2 size={16} /> Manage Customers</span></Button></Link>
          <Link to="/partner/reseller/inventory"><Button variant="outline"><span className="flex items-center gap-2"><PackageSearch size={16} /> View Inventory</span></Button></Link>
          <Link to="/partner/reseller/billing"><Button variant="outline"><span className="flex items-center gap-2"><Receipt size={16} /> View Billing</span></Button></Link>
        </div>
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
