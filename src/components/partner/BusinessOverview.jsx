import { usePartnerAuth } from "../../context/PartnerAuthContext";
import Card from "../ui/Card";
const count = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.count || 0), 0);
const total = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.amount || 0), 0);
const money = (n) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;
export default function BusinessOverview({ type, summary = {}, socialAccounts }) {
  const { hasPermission } = usePartnerAuth();
  let tiles, note, business = 0, completed;
  if (type === "affiliate") {
    const leads = summary.leads || {};
    business = leads.won?.amount || 0; completed = leads.won?.count || 0;
    tiles = [["Leads you referred", count(leads)], ["Won deals", completed], ["Deals in progress", Object.entries(leads).filter(([s]) => !["won", "lost", "rejected"].includes(s)).reduce((n, [, r]) => n + r.count, 0)], ["Business you referred", money(business)]];
    note = "Won-deal value shows the business you referred, not cash collected. Pending deals await SPOTX's decision.";
  } else if (type === "influencer") {
    completed = summary.posts?.approved?.count || 0;
    tiles = [["Posts and reels submitted", count(summary.posts)], ["Approved content", completed], ["Waiting for SPOTX", summary.posts?.pending?.count || 0], ["Instagram submissions", summary.platforms?.instagram?.count || 0]];
    if (socialAccounts !== undefined) tiles.push(["Connected social accounts", socialAccounts]);
    note = "Your contribution is measured by approved content. Sales attributed to posts are not recorded.";
  } else if (type === "vendor") {
    business = summary.payments?.paid?.amount || 0; completed = summary.customers?.active?.count || 0;
    tiles = [["Your customers", count(summary.customers)], ["Active customers", completed], ["Active customer screens", summary.customers?.active?.amount || 0], ["Your customers' payments", money(business)]];
    note = "Payment totals use recorded receipts. Online receipts include tax; your commission is calculated before tax.";
  } else {
    business = summary.invoices?.paid?.amount || 0; completed = summary.inventory?.totalPurchasedLicenses || 0;
    tiles = [["Your customers", count(summary.customers)], ["Bought licences", completed], ["Assigned to customers", summary.inventory?.totalAllocatedLicenses || 0], ["Licence invoices paid", money(business)], ["Outstanding licence invoices", money(total(Object.fromEntries(Object.entries(summary.invoices || {}).filter(([s]) => s !== "paid"))))]];
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
    note = "Paid licence invoices show your business with SPOTX, including tax. Customer sales revenue is not recorded here.";
  }
  if (type !== "reseller" && hasPermission("commissions:view")) {
    const earned = total(Object.fromEntries(Object.entries(summary.earnings || {}).filter(([s]) => s !== "cancelled")));
    const paid = summary.earnings?.settled?.amount || 0;
    tiles.push(["Your earnings", money(earned)], ["Paid to you", money(paid)], ["Awaiting payment", money(earned - paid)]);
  }
  if (type === "reseller" && !hasPermission("reseller:billing:view")) tiles = tiles.filter(([label]) => !["Licence invoices paid", "Outstanding licence invoices"].includes(label));
  if (type === "affiliate" && !hasPermission("referrals:view")) tiles = tiles.filter(([label]) => !["Leads you referred", "Won deals", "Deals in progress", "Business you referred"].includes(label));
  const great = type === "influencer" ? completed >= 10 : business >= 100000;
  const rating = great ? "\u{1F31F} Great contribution" : completed || business ? "\u{1F4C8} Your business is growing" : "\u{1F331} Your journey is starting";
  const secondary = type === "reseller" ? ["Registered screens", "Active screens", "Active customers", "Pending customers", "Suspended customers", "Cancelled customers"] : [];
  const renderTile = ([title, value]) => <div key={title} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{title}</p><p className="text-xl font-bold mt-1 break-words">{value}</p></div>;
  return <Card className="p-5 space-y-4"><div><h2 className="font-semibold text-lg">Your business overview</h2><p className="text-sm mt-1">{rating}</p><p className="text-xs text-slate-500 mt-1">Lifetime totals for your partner account only. Great contribution means {type === "influencer" ? "10 approved posts/reels" : "INR 100,000 of recorded business"} or more.</p></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{tiles.filter(([title]) => !secondary.includes(title)).map(renderTile)}</div>{secondary.length > 0 && <details><summary className="cursor-pointer text-sm font-semibold text-slate-700">Show customer and screen breakdown</summary><div className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-3">{tiles.filter(([title]) => secondary.includes(title)).map(renderTile)}</div></details>}<p className="text-sm text-slate-500">{note}</p></Card>;
}
