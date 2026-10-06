import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { PARTNER_TYPE_COLORS } from "../../utils/partnerTypeColors";

const money = (amount) => `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const count = (n) => (Number(n) || 0).toLocaleString("en-IN");

// What each type's overview shows. `tiles` are the figures that matter for
// that type only; `actions` are the things waiting on SPOTX, each linking
// to the page where it is done.
const TYPES = {
  influencer: {
    title: "Influencer",
    plural: "Influencers",
    intro: "Paid for each approved post or reel, at the rate set on the account it was posted from.",
    earningsLabel: "Content payments",
    tiles: (d) => [
      { label: "Posts / reels approved", value: count(d.postsApproved) },
      { label: "Posts / reels rejected", value: count(d.postsRejected) },
      { label: "Verified social accounts", value: count(d.accountsVerified) }
    ],
    actions: (d, e) => [
      { label: "Posts / reels waiting for approval", value: d.postsPending, to: "/admin/social-media/posts" },
      { label: "Social accounts waiting for approval", value: d.accountsPending, to: "/admin/social-media/accounts" },
      { label: "Payments waiting to be settled", value: e.pending > 0 ? money(e.pending) : 0, to: "/admin/settlements?partnerType=influencer" }
    ]
  },
  affiliate: {
    title: "Affiliate",
    plural: "Affiliates",
    intro: "Refers leads. SPOTX closes the deal and sets a one-time reward for each one won.",
    earningsLabel: "Referral rewards",
    tiles: (d) => [
      { label: "Total leads", value: count(d.totalLeads) },
      { label: "Won deals", value: count(d.wonDeals) },
      { label: "Value of won deals", value: money(d.wonValue) },
      { label: "Rejected leads", value: count(d.rejectedLeads) }
    ],
    actions: (d, e) => [
      { label: "New leads to contact", value: d.newLeads, to: "/admin/leads" },
      { label: "Leads in progress", value: d.contactedLeads, to: "/admin/leads" },
      { label: "Rewards waiting for approval", value: e.awaitingApproval, to: "/admin/commissions?partnerType=affiliate" },
      { label: "Rewards waiting to be settled", value: e.pending > 0 ? money(e.pending) : 0, to: "/admin/settlements?partnerType=affiliate" }
    ]
  },
  vendor: {
    title: "Vendor",
    plural: "Vendors",
    intro: "Brings in customers who subscribe. Earns commission each time one of them pays.",
    earningsLabel: "Commission",
    tiles: (d) => [
      { label: "Customers", value: count(d.totalCustomers) },
      { label: "Active subscriptions", value: count(d.activeCustomers) },
      { label: "On trial", value: count(d.trialCustomers) },
      { label: "Screens paid for", value: count(d.paidScreens) },
      { label: "Paid by customers", value: money(d.revenue) }
    ],
    actions: (d, e) => [
      { label: "Commissions waiting for approval", value: e.awaitingApproval, to: "/admin/commissions?partnerType=vendor" },
      { label: "Commission waiting to be settled", value: e.pending > 0 ? money(e.pending) : 0, to: "/admin/settlements?partnerType=vendor" }
    ]
  },
  reseller: {
    title: "Reseller",
    plural: "Resellers",
    intro: "Buys licences from SPOTX and pays invoices for them. A reseller is not paid commission.",
    tiles: (d) => [
      { label: "Licences bought", value: count(d.licensesPurchased) },
      { label: "Licences allocated to customers", value: count(d.licensesAllocated) },
      { label: "Active licences", value: count(d.licensesActive) },
      { label: "Their customers", value: count(d.customers) },
      { label: "Payment received", value: money(d.amountReceived) }
    ],
    actions: (d) => [
      { label: "Licence requests waiting for approval", value: d.pendingLicenseRequests, to: "/admin/reseller" },
      { label: "Invoices not yet paid", value: d.invoicesDue ? `${count(d.invoicesDue)} · ${money(d.amountDue)}` : 0, to: "/admin/licence-payments" }
    ]
  }
};

function Tile({ label, value, note }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </Card>
  );
}

// The quick overview shown when a partner type is opened in the menu.
// Everything comes from GET /admin/stats/type/:partnerType, computed live.
export default function AdminTypeOverview() {
  const { partnerType } = useParams();
  const config = TYPES[partnerType];
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => adminApi.get(`/admin/stats/type/${partnerType}`)
    .then((res) => { setData(res.data.data); setError(""); })
    .catch((err) => setError(err.response?.data?.message || "Couldn't load the overview."));

  useEffect(() => {
    if (config) load();
  }, [partnerType]); // eslint-disable-line react-hooks/exhaustive-deps
  useAutoRefresh(() => { if (config) load(); }, 30000);

  if (!config) return <Navigate to="/admin/partners" replace />;
  // A different type's figures are never shown under this type's heading.
  const ready = data && data.partnerType === partnerType;
  if (!ready && !error) return <p className="text-slate-400 text-sm">Loading...</p>;
  if (!ready) return <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>;

  const { partners, earnings, details, recentPartners } = data;
  const actions = config.actions(details, earnings || {});
  const listPath = `/admin/partners?partnerType=${partnerType}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: PARTNER_TYPE_COLORS[partnerType] }} />
          {config.title} Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">{config.intro}</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <section aria-labelledby="needs-heading">
        <h2 id="needs-heading" className="font-semibold text-slate-900 mb-3">Waiting on SPOTX</h2>
        <Card className="divide-y divide-slate-100">
          {actions.map((action) => (
            <Link key={action.label} to={action.to} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition">
              <span className="text-sm text-slate-700">{action.label}</span>
              <span className={`text-sm font-semibold tabular-nums ${action.value ? "text-slate-900" : "text-slate-400"}`}>
                {action.value || "None"}
              </span>
            </Link>
          ))}
        </Card>
      </section>

      <section aria-labelledby="partners-heading">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 id="partners-heading" className="font-semibold text-slate-900">{config.plural}</h2>
          <Link to={listPath} className="text-xs font-semibold text-brand-red hover:underline">View all {config.plural.toLowerCase()}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Tile label="Total" value={count(partners.total)} />
          <Tile label="Active" value={count(partners.active)} />
          <Tile label="Awaiting verification" value={count(partners.pendingVerification)} />
          <Tile label="KYC pending" value={count(partners.kycPending)} />
          <Tile label="Bank details pending" value={count(partners.bankPending)} />
          <Tile label="Rejected / suspended" value={`${count(partners.rejected)} / ${count(partners.suspended)}`} />
        </div>
      </section>

      <section aria-labelledby="figures-heading">
        <h2 id="figures-heading" className="font-semibold text-slate-900 mb-3">{config.title} figures</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {config.tiles(details).map((tile) => <Tile key={tile.label} {...tile} />)}
        </div>
      </section>

      {earnings && (
        <section aria-labelledby="earnings-heading">
          <h2 id="earnings-heading" className="font-semibold text-slate-900 mb-3">{config.earningsLabel}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Tile label="Total" value={money(earnings.total)} note={`${count(earnings.count)} in all`} />
            <Tile label="Already paid" value={money(earnings.paid)} />
            <Tile label="Still to pay" value={money(earnings.pending)} />
          </div>
        </section>
      )}

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="font-semibold text-slate-900 mb-3">Newest {config.plural.toLowerCase()}</h2>
        <Card className="divide-y divide-slate-100">
          {recentPartners.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No {config.plural.toLowerCase()} yet.</p>}
          {recentPartners.map((partner) => (
            <Link key={partner._id} to={`/admin/partners/${partner._id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{partner.name || "Incomplete profile"}</p>
                <p className="text-xs text-slate-400 truncate">{partner.partnerCode} · {partner.email}</p>
              </div>
              <Badge status={partner.status} />
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}
