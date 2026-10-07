import Card from "../ui/Card";
const count = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.count || 0), 0);
const total = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.amount || 0), 0);
const money = (n) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;
export default function BusinessOverview({ type, summary = {} }) {
  let tiles, note, business = 0, completed;
  if (type === "affiliate") {
    const leads = summary.leads || {};
    business = leads.won?.amount || 0; completed = leads.won?.count || 0;
    tiles = [["Leads you referred", count(leads)], ["Won deals", completed], ["Deals in progress", Object.entries(leads).filter(([s]) => !["won", "lost", "rejected"].includes(s)).reduce((n, [, r]) => n + r.count, 0)], ["Business you referred", money(business)]];
    note = "Won-deal value shows the business you referred, not cash collected. Pending deals await SPOTX's decision.";
  } else if (type === "influencer") {
    completed = summary.posts?.approved?.count || 0;
    tiles = [["Posts and reels submitted", count(summary.posts)], ["Approved content", completed], ["Waiting for SPOTX", summary.posts?.pending?.count || 0], ["Instagram submissions", summary.platforms?.instagram?.count || 0]];
    note = "Your contribution is measured by approved content. Sales attributed to posts are not recorded.";
  } else if (type === "vendor") {
    business = summary.payments?.paid?.amount || 0; completed = summary.customers?.active?.count || 0;
    tiles = [["Your customers", count(summary.customers)], ["Active customers", completed], ["Active customer screens", summary.customers?.active?.amount || 0], ["Your customers' payments", money(business)]];
    note = "Payment totals use recorded receipts. Online receipts include tax; your commission is calculated before tax.";
  } else {
    business = summary.invoices?.paid?.amount || 0; completed = summary.inventory?.totalPurchasedLicenses || 0;
    tiles = [["Your customers", count(summary.customers)], ["Licences purchased", completed], ["Licences allocated", summary.inventory?.totalAllocatedLicenses || 0], ["Licence invoices paid", money(business)], ["Outstanding licence invoices", money(total(Object.fromEntries(Object.entries(summary.invoices || {}).filter(([s]) => s !== "paid"))))]];
    note = "Paid licence invoices show your business with SPOTX, including tax. Customer sales revenue is not recorded here.";
  }
  if (type !== "reseller") {
    const earned = total(Object.fromEntries(Object.entries(summary.earnings || {}).filter(([s]) => s !== "cancelled")));
    const paid = summary.earnings?.settled?.amount || 0;
    tiles.push(["Your earnings", money(earned)], ["Paid to you", money(paid)], ["Awaiting payment", money(earned - paid)]);
  }
  const great = type === "influencer" ? completed >= 10 : business >= 100000;
  const rating = great ? "\u{1F31F} Great contribution" : completed || business ? "\u{1F4C8} Your business is growing" : "\u{1F331} Your journey is starting";
  return <Card className="p-5 space-y-4"><div><h2 className="font-semibold text-lg">Your business overview</h2><p className="text-sm mt-1">{rating}</p><p className="text-xs text-slate-500 mt-1">Lifetime totals for your partner account only. Great contribution means {type === "influencer" ? "10 approved posts/reels" : "INR 100,000 of recorded business"} or more.</p></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{tiles.map(([title, value]) => <div key={title} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{title}</p><p className="text-xl font-bold mt-1 break-words">{value}</p></div>)}</div><p className="text-sm text-slate-500">{note}</p></Card>;
}
