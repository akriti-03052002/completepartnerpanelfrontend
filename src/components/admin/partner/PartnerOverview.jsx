import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../services/adminApi";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import { partnerSectionPath } from "./partnerSections";

const money = (amount) => `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const count = (n) => (Number(n) || 0).toLocaleString("en-IN");
const sum = (rows, pick) => rows.reduce((total, row) => total + (Number(pick(row)) || 0), 0);

function Tile({ label, value, note, to }) {
  const body = (
    <Card className={`p-4 h-full ${to ? "hover:border-slate-300 transition" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </Card>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

// What is fetched for one partner, by type. Each is the same list the
// matching admin page shows, narrowed to this partner.
const loaders = {
  influencer: (id) => Promise.all([
    adminApi.get("/admin/social-media/posts", { params: { partnerId: id } }).then((res) => res.data.data),
    adminApi.get("/admin/commissions", { params: { partnerId: id } }).then((res) => res.data.data)
  ]).then(([posts, earnings]) => ({ posts, earnings })),
  affiliate: (id) => Promise.all([
    adminApi.get("/admin/leads", { params: { partnerId: id } }).then((res) => res.data.data),
    adminApi.get("/admin/commissions", { params: { partnerId: id } }).then((res) => res.data.data)
  ]).then(([leads, earnings]) => ({ leads, earnings })),
  vendor: (id) => Promise.all([
    adminApi.get("/admin/customers", { params: { partnerId: id } }).then((res) => res.data.data),
    adminApi.get("/admin/commissions", { params: { partnerId: id } }).then((res) => res.data.data)
  ]).then(([customers, earnings]) => ({ customers, earnings })),
  reseller: (id) => Promise.all([
    adminApi.get(`/admin/reseller/partners/${id}`).then((res) => res.data.data),
    adminApi.get("/admin/reseller/invoices", { params: { partnerId: id } }).then((res) => res.data.data)
  ]).then(([reseller, invoices]) => ({ reseller, invoices }))
};

/**
 * The quick overview of ONE partner — the first thing an admin sees when
 * opening them: where their verification stands and the figures that matter
 * for their type, each linking to the tab or page with the detail.
 */
export default function PartnerOverview({ partner, documents, requiredDocumentTypes, bankAccount, team }) {
  const type = partner.partnerType;
  const id = partner._id;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loaders[type](id)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Couldn't load this partner's figures."); });
    return () => { active = false; };
  }, [id, type]);

  const verifiedTypes = new Set(documents.filter((d) => d.verification?.status === "verified").map((d) => d.documentType));
  const kycDone = requiredDocumentTypes.filter((t) => verifiedTypes.has(t)).length;
  const kycComplete = kycDone === requiredDocumentTypes.length;

  const earnings = data?.earnings?.filter((e) => e.settlement?.status !== "cancelled") || [];
  const paid = sum(earnings.filter((e) => e.settlement?.status === "settled"), (e) => e.calculation?.netCommission);
  const total = sum(earnings, (e) => e.calculation?.netCommission);
  const earningsTiles = type === "reseller" ? [] : [
    { label: "Total earned", value: money(total), note: `${count(earnings.length)} in all`, to: partnerSectionPath(id, "rewards") },
    { label: "Already paid", value: money(paid), to: partnerSectionPath(id, "settlements") },
    { label: "Still to pay", value: money(total - paid), to: partnerSectionPath(id, "settlements") }
  ];

  let typeTiles = [];
  if (data && type === "influencer") {
    const accounts = partner.socialAccounts || [];
    typeTiles = [
      { label: "Posts / reels waiting for approval", value: count(data.posts.filter((p) => p.status === "pending").length), to: partnerSectionPath(id, "posts") },
      { label: "Approved", value: count(data.posts.filter((p) => p.status === "approved").length), to: partnerSectionPath(id, "posts") },
      { label: "Rejected", value: count(data.posts.filter((p) => p.status === "rejected").length), to: partnerSectionPath(id, "posts") },
      { label: "Social accounts", value: count(accounts.length), note: `${count(accounts.filter((a) => a.reviewStatus === "verified").length)} verified · ${count(accounts.filter((a) => a.reviewStatus === "pending").length)} waiting`, to: partnerSectionPath(id, "accounts") }
    ];
  }
  if (data && type === "affiliate") {
    const won = data.leads.filter((l) => l.status === "won");
    typeTiles = [
      { label: "Leads", value: count(data.leads.length), to: partnerSectionPath(id, "leads") },
      { label: "Open leads", value: count(data.leads.filter((l) => ["new", "contacted"].includes(l.status)).length), to: partnerSectionPath(id, "leads") },
      { label: "Won deals", value: count(won.length), to: partnerSectionPath(id, "leads") },
      { label: "Value of won deals", value: money(sum(won, (l) => l.closure?.dealValue)) }
    ];
  }
  if (data && type === "vendor") {
    const active = data.customers.filter((c) => c.subscription?.status === "active");
    typeTiles = [
      { label: "Customers", value: count(data.customers.length), to: "/admin/customers" },
      { label: "Active subscriptions", value: count(active.length) },
      { label: "Screens paid for", value: count(sum(active, (c) => c.subscription?.screenCount)) },
      { label: "Paid by their customers", value: money(sum(earnings, (e) => e.transaction?.revenue)) }
    ];
  }
  if (data && type === "reseller") {
    const inventory = data.reseller?.inventory || {};
    const paidInvoices = data.invoices.filter((i) => i.paymentStatus === "paid");
    const dueInvoices = data.invoices.filter((i) => i.paymentStatus !== "paid");
    typeTiles = [
      { label: "Licences bought", value: count(inventory.totalPurchasedLicenses) },
      { label: "Allocated to customers", value: count(inventory.totalAllocatedLicenses) },
      { label: "Active licences", value: count(inventory.totalActiveScreens) },
      { label: "Invoices paid", value: money(sum(paidInvoices, (i) => i.total)), note: `${count(paidInvoices.length)} invoice(s)`, to: "/admin/licence-payments" },
      { label: "Invoices not yet paid", value: money(sum(dueInvoices, (i) => i.total)), note: `${count(dueInvoices.length)} invoice(s)`, to: "/admin/licence-payments" }
    ];
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <p className="text-sm text-slate-500 mb-1.5">Account</p>
            <Badge status={partner.status} />
          </div>
          <Link to={partnerSectionPath(id, "kyc")} className="block group">
            <p className="text-sm text-slate-500 mb-1.5">KYC documents</p>
            <Badge status={kycComplete ? "verified" : "pending"}>{kycDone} of {requiredDocumentTypes.length} verified</Badge>
          </Link>
          <Link to={partnerSectionPath(id, "kyc")} className="block group">
            <p className="text-sm text-slate-500 mb-1.5">Bank account</p>
            <Badge status={bankAccount ? bankAccount.verification.status : "not_submitted"} />
          </Link>
          <Link to={partnerSectionPath(id, "team")} className="block group">
            <p className="text-sm text-slate-500 mb-1.5">Team logins</p>
            <p className="text-sm font-semibold text-slate-900">{count(team.length)}</p>
          </Link>
        </div>
      </Card>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {!data && !error && <p className="text-slate-400 text-sm">Loading figures...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {typeTiles.map((tile) => <Tile key={tile.label} {...tile} />)}
          </div>
          {earningsTiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {earningsTiles.map((tile) => <Tile key={tile.label} {...tile} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
