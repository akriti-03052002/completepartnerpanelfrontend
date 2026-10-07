import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import BusinessOverview from "../../../components/partner/BusinessOverview";
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
  const { hasPermission } = usePartnerAuth();
  const [retry, setRetry] = useState(0);
  const [business, setBusiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [inventory, setInventory] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/partner/dashboard").then((res) => active && setBusiness(res.data.data.businessOverview)),
      hasPermission("reseller:inventory:view") ? api.get("/partner/reseller/inventory").then((res) => active && setInventory(res.data.data)) : Promise.resolve(),
      hasPermission("reseller:billing:view") ? api.get("/partner/reseller/invoices").then((res) => active && setInvoices(res.data.data)) : Promise.resolve()
    ]).then(() => { if (active) setLoadError(""); }).catch(() => { if (active) setLoadError("Could not load your dashboard figures. Please try again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hasPermission, retry]);

  if (loading) return <p className="text-slate-400 text-sm p-6">Loading...</p>;

  if (loadError) return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError} <button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1); }} className="font-semibold underline">Try again</button></div>;

  const available = Math.max(0, (inventory?.totalPurchasedLicenses || 0) - (inventory?.totalAllocatedLicenses || 0));
  const currentInvoice = invoices.filter(i => i.paymentStatus !== "paid").sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const lastPaid = invoices.find((i) => i.paymentStatus === "paid");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reseller Dashboard</h1>
      {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
      {business && <BusinessOverview type="reseller" summary={business} />}
      <Card className="p-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{currentInvoice ? "Review your outstanding payment" : available === 0 ? "Check your screen licences" : "Manage your customers"}</h2><p className="text-sm text-slate-500 mt-1">{currentInvoice ? `Your next unpaid bill is due ${new Date(currentInvoice.dueDate).toLocaleDateString("en-IN")}. Open billing to review or pay it.` : available === 0 ? "Review your licences and request more when you need them." : `${available} licences are available for customer allocation.`}</p></div>{hasPermission(currentInvoice ? "reseller:billing:view" : available === 0 ? "reseller:inventory:view" : "reseller:customers:manage") && <Link to={currentInvoice ? "/partner/reseller/billing" : available === 0 ? "/partner/reseller/inventory" : "/partner/reseller/customers"} className="rounded-lg bg-brand-red text-white px-4 py-2 text-sm font-semibold">{currentInvoice ? "Open billing" : available === 0 ? "View licences" : "Open customers"}</Link>}</Card>

        {hasPermission("reseller:billing:view") && <Card className="p-6">
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
        </Card>}

      <Card className="p-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">What would you like to do?</p>
        <div className="flex flex-wrap gap-3">
          {hasPermission("reseller:license:purchase") && <Link to="/partner/reseller/buy"><Button><span className="flex items-center gap-2"><ShoppingCart size={16} /> Request more licences</span></Button></Link>}
          {hasPermission("reseller:customers:manage") && (currentInvoice || available === 0) && <Link to="/partner/reseller/customers"><Button variant="outline"><span className="flex items-center gap-2"><Building2 size={16} /> Assign licences to customers</span></Button></Link>}
          {hasPermission("reseller:inventory:view") && (currentInvoice || available > 0) && <Link to="/partner/reseller/inventory"><Button variant="outline"><span className="flex items-center gap-2"><PackageSearch size={16} /> Check available licences</span></Button></Link>}
          {hasPermission("reseller:billing:view") && !currentInvoice && <Link to="/partner/reseller/billing"><Button variant="outline"><span className="flex items-center gap-2"><Receipt size={16} /> View Billing</span></Button></Link>}
        </div>
      </Card>
    </div>
  );
}
