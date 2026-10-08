import { useAdminAuth } from "../../context/AdminAuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Users, ShieldCheck, Landmark, Wallet, Receipt, ArrowRight } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import PartnerTypeBarChart from "../../components/admin/PartnerTypeBarChart";
import { PARTNER_TYPE_COLORS } from "../../utils/partnerTypeColors";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const money = (amount) => `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const count = (n) => (Number(n) || 0).toLocaleString("en-IN");

// A headline number with what it means underneath.
function Figure({ label, value, note, dot }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-slate-500">
        {dot && <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: dot }} />}
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  );
}

// One partner type's block: a title and a short list of label / value rows.
function TypeBlock({ type, title, rows, to, linkLabel }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PARTNER_TYPE_COLORS[type] }} />
          {title}
        </h3>
        {to && <Link to={to} className="text-xs font-semibold text-brand-red hover:underline">{linkLabel}</Link>}
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className={`tabular-nums text-slate-900 ${row.strong ? "text-lg font-bold" : "text-sm font-semibold"}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function CountTile({ label, value, to, note }) {
  const body = (
    <Card className={`p-4 h-full ${to ? "hover:border-slate-300 transition" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{count(value)}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </Card>
  );
  return to ? <Link to={to} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red">{body}</Link> : body;
}

// Every figure on this page comes from GET /admin/stats/dashboard, which
// computes it live from the records themselves (invoices, customer
// payments, leads, commissions, partners) — nothing is stored or hardcoded.
// It refreshes on its own.
export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const role = user?.role;
  const canReview = ["super_admin", "kyc_reviewer"].includes(role);
  const canFinance = ["super_admin", "finance"].includes(role);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchDashboard = () => adminApi.get("/admin/stats/dashboard")
    .then((res) => { setData(res.data.data); setUpdatedAt(new Date()); setError(""); })
    .catch((err) => setError(err.response?.data?.message || "Couldn't load the dashboard."));

  const load = () => {
    setRefreshing(true);
    return fetchDashboard().finally(() => setRefreshing(false));
  };

  useEffect(() => { fetchDashboard(); }, []);
  useAutoRefresh(fetchDashboard, 30000);

  if (!data && !error) return <p className="text-slate-400 text-sm">Loading...</p>;
  if (!data) return <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error} <button onClick={load} className="underline font-semibold">Try again</button></div>;

  const { overview, reseller, vendor, affiliate, payouts, partners } = data;

  const tasks = [
    { label: "Find a partner", to: "/admin/partners", icon: Users, note: "Search profiles, check progress and update account details." },
    ...(canReview ? [
      { label: "Review identity documents", to: "/admin/documents", icon: ShieldCheck, note: "Preview submitted documents and approve or request corrections." },
      { label: "Review bank details", to: "/admin/bank", icon: Landmark, note: "Check bank accounts before partner payments." }
    ] : []),
    ...(canFinance ? [
      { label: "Review partner earnings", to: "/admin/commissions", icon: Wallet, note: "Check commissions, referral rewards and content payments." },
      { label: "Manage payments to partners", to: "/admin/settlements", icon: ArrowUpRight, note: "Review settlements and track payments to partners." },
      { label: "Check reseller bills", to: "/admin/licence-payments", icon: Receipt, note: "See bills due this week, overdue payments and paid invoices." }
    ] : [])
  ];

  const incomeRows = [
    {
      key: "reseller",
      label: "Reseller",
      value: reseller.totalAmount,
      valueLabel: money(reseller.totalAmount),
      details: [
        { label: "Total licences bought", value: count(reseller.licensesPurchased) },
        { label: "Total payment received", value: money(reseller.totalAmount) }
      ]
    },
    {
      key: "vendor",
      label: "Vendor",
      value: vendor.totalAmount,
      valueLabel: money(vendor.totalAmount),
      details: [
        { label: "Total customers", value: count(vendor.totalCustomers) },
        { label: "Total payment from customers", value: money(vendor.totalAmount) }
      ]
    },
    {
      key: "affiliate",
      label: "Affiliate",
      value: affiliate.totalAmount,
      valueLabel: money(affiliate.totalAmount),
      details: [
        { label: "Total leads", value: count(affiliate.totalLeads) },
        { label: "Won deals", value: count(affiliate.wonDeals) },
        { label: "Total amount from won deals", value: money(affiliate.totalAmount) }
      ]
    }
  ];

  const payoutRows = [
    { key: "vendor", label: "Vendor", noun: "commission" },
    { key: "affiliate", label: "Affiliate", noun: "referral rewards" },
    { key: "influencer", label: "Influencer", noun: "content payments" }
  ].map(({ key, label, noun }) => ({
    key,
    label,
    value: payouts[key].total,
    valueLabel: money(payouts[key].total),
    details: [
      { label: `Total ${noun}`, value: money(payouts[key].total) },
      { label: "Already paid", value: money(payouts[key].paid) },
      { label: "Still to pay", value: money(payouts[key].pending) }
    ]
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1><p className="mt-1 text-sm text-slate-500">Manage partners, approvals and payments from one place.</p></div>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          aria-busy={refreshing}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : `Refresh - updated ${updatedAt?.toLocaleTimeString() || "just now"}`}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <section aria-labelledby="admin-tasks-heading">
        <h2 id="admin-tasks-heading" className="font-semibold text-lg text-slate-900">Choose a task</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">Open a partner profile to see their approval checklist, or go straight to a review below.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {tasks.map(({ label, to, icon: Icon, note }) => (
            <Link key={to} to={to} className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm">
              <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Icon size={20} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold text-sm text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{note}</span></span>
              <ArrowRight size={16} aria-hidden="true" className="mt-3 shrink-0 text-slate-400 group-hover:text-slate-900" />
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Business overview ---------- */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="font-semibold text-slate-900 mb-3">Business Overview</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <Figure label="From Resellers" value={money(overview.resellerRevenue)} note="Licence invoices and prepayments paid" dot={PARTNER_TYPE_COLORS.reseller} />
            <Figure label="From Vendors" value={money(overview.vendorRevenue)} note="Paid by their customers (before GST)" dot={PARTNER_TYPE_COLORS.vendor} />
            <Figure label="From Affiliates" value={money(overview.affiliateRevenue)} note="Value of deals won from their leads" dot={PARTNER_TYPE_COLORS.affiliate} />
            <Figure
              label="Total commission we pay"
              value={money(overview.totalCommission)}
              note={`${money(overview.totalCommissionPaid)} paid · ${money(overview.totalCommissionPending)} still to pay`}
            />
          </div>
          <p className="text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100">
            Combined recorded business value: <span className="font-semibold text-slate-900">{money(overview.totalRevenue)}</span>
          </p>
        </Card>
      </section>

      {/* ---------- The two bar graphs ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Payments in and commission out">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-emerald-700 mb-3">
            <ArrowDownLeft size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Money coming in</span>
          </div>
          <PartnerTypeBarChart
            title="Recorded Business by Partner Type"
            subtitle="Affiliate figures are won-deal value, not cash received. Hover or tap for details."
            rows={incomeRows}
            emptyText="No payments received yet."
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-slate-600 mb-3">
            <ArrowUpRight size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Money going out</span>
          </div>
          <PartnerTypeBarChart
            title="Commission we are giving"
            subtitle="By partner type. Hover or tap a bar for paid and still-to-pay."
            rows={payoutRows}
            emptyText="No commission earned by partners yet."
          />
        </Card>
      </section>

      {/* ---------- Business gain ---------- */}
      <section aria-labelledby="gain-heading">
        <h2 id="gain-heading" className="font-semibold text-slate-900 mb-3">Business by Partner Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TypeBlock
            type="reseller"
            title="Reseller"
            to="/admin/reseller"
            linkLabel="Reseller operations"
            rows={[
              { label: "Total licences bought", value: count(reseller.licensesPurchased) },
              { label: "Active licences", value: count(reseller.licensesActive) },
              { label: "Total amount", value: money(reseller.totalAmount), strong: true }
            ]}
          />
          <TypeBlock
            type="vendor"
            title="Vendor"
            to="/admin/customers"
            linkLabel="Customers"
            rows={[
              { label: "Paid screens", value: count(vendor.paidScreens) },
              { label: "Customers", value: `${count(vendor.activeCustomers)} active of ${count(vendor.totalCustomers)}` },
              { label: "Total amount", value: money(vendor.totalAmount), strong: true }
            ]}
          />
          <TypeBlock
            type="affiliate"
            title="Affiliate"
            to="/admin/leads"
            linkLabel="Leads"
            rows={[
              { label: "Leads", value: count(affiliate.totalLeads) },
              { label: "Won deals", value: count(affiliate.wonDeals) },
              { label: "Total amount from won deals", value: money(affiliate.totalAmount), strong: true }
            ]}
          />
        </div>
      </section>

      {/* ---------- Business paid ---------- */}
      <section aria-labelledby="paid-heading">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 id="paid-heading" className="font-semibold text-slate-900">Payments to Partners</h2>
          <Link to="/admin/settlements" className="text-xs font-semibold text-brand-red hover:underline">Settlements</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { type: "vendor", title: "Vendor commission" },
            { type: "affiliate", title: "Affiliate rewards" },
            { type: "influencer", title: "Influencer payments" }
          ].map(({ type, title }) => (
            <TypeBlock
              key={type}
              type={type}
              title={title}
              rows={[
                { label: "Total", value: money(payouts[type].total), strong: true },
                { label: "Already paid", value: money(payouts[type].paid) },
                { label: "Still to pay", value: money(payouts[type].pending) }
              ]}
            />
          ))}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PARTNER_TYPE_COLORS.reseller }} />
              Reseller
            </h3>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{money(0)}</p>
            <p className="text-xs text-slate-400 mt-2">Resellers are not paid commission — they buy licences from SPOTX.</p>
          </Card>
        </div>
      </section>

      {/* ---------- Partners ---------- */}
      <section aria-labelledby="partners-heading">
        <h2 id="partners-heading" className="font-semibold text-slate-900 mb-3">Partners</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <CountTile label="Total partners" value={partners.total} to="/admin/partners" />
          <CountTile label="Resellers" value={partners.byType.reseller} to="/admin/partners?partnerType=reseller" />
          <CountTile label="Affiliates" value={partners.byType.affiliate} to="/admin/partners?partnerType=affiliate" />
          <CountTile label="Vendors" value={partners.byType.vendor} to="/admin/partners?partnerType=vendor" />
          <CountTile label="Influencers" value={partners.byType.influencer} to="/admin/partners?partnerType=influencer" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
          <CountTile label="Active" value={partners.active} to="/admin/partners?status=active" note="All types" />
          <CountTile label="Verified" value={partners.verified} to="/admin/partners?verificationStatus=verified" note="KYC and bank verified" />
          <CountTile label="Identity checks incomplete" value={partners.kycPending} to="/admin/documents" note="Documents not all verified" />
          <CountTile label="Bank checks incomplete" value={partners.bankPending} to="/admin/bank" note="Missing details, verification or bank updates" />
          <CountTile label="Rejected" value={partners.rejected} to="/admin/partners?status=rejected" />
          <CountTile label="Suspended" value={partners.suspended} to="/admin/partners?status=suspended" />
        </div>
      </section>
    </div>
  );
}
