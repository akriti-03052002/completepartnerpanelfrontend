import AllocationChart from "../ui/AllocationChart";
import { Monitor, Zap, Users, Clock, PauseCircle, XCircle, Wallet, Megaphone, Package } from "lucide-react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import Card from "../ui/Card";
const count = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.count || 0), 0);
const total = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.amount || 0), 0);
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const statusRows = (groups) => Object.entries(groups).map(([label, row]) => ({
  label,
  value: row.count,
  color: ["active", "approved", "verified", "won"].includes(label) ? "bg-emerald-500"
    : ["rejected", "lost", "suspended", "cancelled", "expired"].includes(label) ? "bg-red-400"
    : ["pending", "under_review", "trial", "allocated", "pending_activation"].includes(label) ? "bg-amber-400" : "bg-blue-500"
}));
export default function BusinessOverview({ type, summary = {}, socialAccounts }) {
  const { hasPermission } = usePartnerAuth();
  let tiles, note, business, completed;
  if (type === "affiliate") {
    const leads = summary.leads || {};
    business = leads.won?.amount || 0; completed = leads.won?.count || 0;
    tiles = [["Leads you referred", count(leads)], ["Won deals", completed], ["Deals in progress", Object.entries(leads).filter(([s]) => !["won", "lost", "rejected"].includes(s)).reduce((n, [, r]) => n + r.count, 0)], ["Value of confirmed deals", money(business)]];
    note = "Deal value is the value of confirmed sales. It is separate from your earnings.";
  } else if (type === "influencer") {
    completed = summary.posts?.approved?.count || 0;
    tiles = [["Posts and reels submitted", count(summary.posts)], ["Approved content", completed], ["Waiting for SPOTX", summary.posts?.pending?.count || 0], ["Instagram submissions", summary.platforms?.instagram?.count || 0]];
    if (socialAccounts !== undefined) tiles.push(["Connected social accounts", socialAccounts]);
    note = "Approved content means SpotX accepted your post or reel. Payment may still be pending.";
  } else if (type === "vendor") {
    business = summary.payments?.paid?.amount || 0; completed = summary.customers?.active?.count || 0;
    tiles = [["Your customers", count(summary.customers)], ["Active customers", completed], ["Subscribed screens", summary.customers?.active?.amount || 0], ["Customer bills paid", money(business)]];
    note = "Customer bills paid include online payment tax. Your commission is calculated on the amount before tax. Subscribed screens are screen slots customers have paid for.";
  } else {
    business = summary.invoices?.paid?.amount || 0; completed = summary.inventory?.totalPurchasedLicenses || 0;
    tiles = [["Your customers", count(summary.customers)], ["Bought licences", completed], ["Assigned to customers", summary.inventory?.totalAllocatedLicenses || 0], ["Licence bills paid", money(business)], ["Licence bills to pay", money(total(Object.fromEntries(Object.entries(summary.invoices || {}).filter(([s]) => s !== "paid"))))]];
    const inventory = summary.inventory || {};
    tiles.push(
      ["Ready to assign", Math.max(0, completed - (inventory.totalAllocatedLicenses || 0))],
      ["Registered screens", inventory.totalRegisteredScreens || 0],
      ["Active screens", inventory.totalActiveScreens || 0],
      ["Active customers", summary.customers?.active?.count || 0],
      ["Pending customers", ["pending", "allocated", "pending_activation"].reduce((n, status) => n + (summary.customers?.[status]?.count || 0), 0)],
      ["Suspended customers", summary.customers?.suspended?.count || 0],
      ["Cancelled customers", summary.customers?.cancelled?.count || 0]
    );
    note = "Licence bills paid shows what you paid SpotX, including tax. Your own customer sales and profit are not tracked here.";
  }
  if (type !== "reseller" && hasPermission("commissions:view")) {
    const earned = total(Object.fromEntries(Object.entries(summary.earnings || {}).filter(([s]) => s !== "cancelled")));
    const paid = summary.earnings?.settled?.amount || 0;
    tiles.push(["Recorded earnings", money(earned)], ["Paid to you", money(paid)], ["Not paid yet", money(earned - paid)]);
  }
  if (type === "reseller" && !hasPermission("reseller:billing:view")) tiles = tiles.filter(([label]) => !["Licence bills paid", "Licence bills to pay"].includes(label));
  if (type === "affiliate" && !hasPermission("referrals:view")) tiles = tiles.filter(([label]) => !["Leads you referred", "Won deals", "Deals in progress", "Value of confirmed deals"].includes(label));
  let chart = null;
  if (type === "affiliate" && hasPermission("referrals:view") && summary.leads) chart = { title: "Deal progress", total: count(summary.leads), totalLabel: "Total deals", note: "Your referrals grouped by deal status.", rows: statusRows(summary.leads) };
  if (type === "influencer" && summary.posts) chart = { title: "Content review progress", total: count(summary.posts), totalLabel: "Total submissions", note: "Posts and reels grouped by review status. Approved does not mean paid.", rows: statusRows(summary.posts) };
  if (type === "vendor" && hasPermission("customers:view") && summary.customers) chart = { title: "Customer subscriptions", total: count(summary.customers), totalLabel: "Total customers", note: "Your customers grouped by subscription status.", rows: statusRows(summary.customers) };
  if (type === "reseller" && hasPermission("reseller:inventory:view") && summary.inventory) {
    const bought = Number(summary.inventory.totalPurchasedLicenses) || 0;
    const assigned = Number(summary.inventory.totalAllocatedLicenses) || 0;
    chart = { title: "Licence allocation", total: bought, totalLabel: "Bought licences", note: "Available licences can be assigned to customers. Assigned licences are reserved screen slots; the screens may not be running yet.", rows: [{ label: "Ready to assign", value: Math.max(0, bought - assigned), color: "bg-emerald-500" }, { label: "Assigned to customers", value: assigned, color: "bg-blue-500" }] };
    tiles = tiles.filter(([title]) => !["Bought licences", "Assigned to customers", "Ready to assign"].includes(title));
  }
  if (chart && type !== "reseller") {
    const repeated = type === "vendor" ? ["Your customers", "Active customers"]
      : type === "affiliate" ? ["Leads you referred", "Won deals", "Deals in progress"]
      : ["Posts and reels submitted", "Approved content", "Waiting for SPOTX"];
    tiles = tiles.filter(([title]) => !repeated.includes(title));
  }
  const secondary = type === "reseller" ? ["Registered screens", "Active screens", "Active customers", "Pending customers", "Suspended customers", "Cancelled customers"] : [];
  const renderTile = ([title, value]) => {
    const Icon = /screens/i.test(title) ? Monitor : /customers/i.test(title) ? Users : /posts|instagram|social/i.test(title) ? Megaphone : /licences|assign/i.test(title) ? Package : Wallet;
    const colour = /paid to you|available/i.test(title) ? "bg-emerald-50 text-emerald-600" : /not paid|to pay/i.test(title) ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600";
    return <div key={title} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs text-slate-500">{title}</p><span className={`rounded-lg p-2 shrink-0 ${colour}`}><Icon size={17} aria-hidden="true" /></span></div><p className="text-xl font-bold mt-1 break-words">{value}</p></div>;
  };
  const breakdownStyle = {
    "Registered screens": { icon: Monitor, color: "bg-blue-50 text-blue-600" },
    "Active screens": { icon: Zap, color: "bg-emerald-50 text-emerald-600" },
    "Active customers": { icon: Users, color: "bg-emerald-50 text-emerald-600" },
    "Pending customers": { icon: Clock, color: "bg-amber-50 text-amber-600" },
    "Suspended customers": { icon: PauseCircle, color: "bg-orange-50 text-orange-600" },
    "Cancelled customers": { icon: XCircle, color: "bg-red-50 text-red-600" }
  };
  return <Card className="p-5 space-y-4">
    <div><h2 className="font-semibold text-lg">Your business overview</h2><p className="text-xs text-slate-500 mt-1">Totals for your partner account since you joined.{type !== "reseller" && hasPermission("commissions:view") ? " Recorded earnings include amounts waiting for approval." : ""}</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{tiles.filter(([title]) => !secondary.includes(title)).map(renderTile)}</div>
    {secondary.length > 0 && <section aria-label="Customer and screen breakdown">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Customers & screens</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{tiles.filter(([title]) => secondary.includes(title)).map(([title, value]) => {
        const style = breakdownStyle[title];
        const Icon = style.icon;
        return <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.color}`}><Icon size={20} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-xl font-bold tabular-nums">{value}</p><p className="text-xs text-slate-500 mt-1">{title}</p></div>
        </div>;
      })}</div>
    </section>}
    {chart && <AllocationChart {...chart} />}
    <p className="text-sm text-slate-500">{note}</p>
  </Card>;
}
