import { Link } from "react-router-dom";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import { partnerSectionPath } from "./partnerSections";
const money = (n) => `INR ${Number(n || 0).toLocaleString("en-IN")}`;
const amount = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.amount || 0), 0);
const count = (rows = {}) => Object.values(rows).reduce((n, row) => n + (row.count || 0), 0);
const label = (text = "") => text.replaceAll("_", " ");
export default function PartnerProfileSummary({ partner, documents = [], requiredDocumentTypes = [], bankAccount, summary = {}, compact = false }) {
  const type = partner.partnerType;
  const path = (section) => partnerSectionPath(partner._id, section);
  const checks = requiredDocumentTypes.map((documentType) => {
    const docs = documents.filter((d) => d.documentType === documentType);
    const verified = docs.some((d) => d.verification?.status === "verified");
    const latest = docs[0];
    return { title: label(documentType), done: verified, note: verified ? "Verified" : latest ? label(latest.verification?.status || "pending") : "Upload required", to: path("kyc") };
  });
  checks.push({ title: "Profile details", done: !!partner.legalEntity?.businessName && (type !== "influencer" || !!(partner.address?.state && partner.address?.city)), note: partner.legalEntity?.businessName ? "Check business and contact details" : "Complete profile details", to: path("details") });
  checks.push({ title: "Bank verification", done: bankAccount?.verification?.status === "verified", note: bankAccount ? label(bankAccount.verification?.status || "pending") : "Bank details required", to: path("kyc") });
  if (type !== "reseller") checks.push({ title: "Payout eligibility", done: bankAccount?.commissionEligibility === "eligible", note: bankAccount?.commissionEligibility === "eligible" ? "Eligible" : "Bank check and admin approval required", to: path("kyc") });
  if (type === "vendor") checks.push({ title: "Individual commission", done: !!summary.assignment, note: summary.assignment ? `${label(summary.assignment.commissionType)}${summary.assignment.rate ? ` | ${summary.assignment.rate}%` : ""}${summary.assignment.fixedAmount ? ` | ${money(summary.assignment.fixedAmount)}` : ""}${summary.assignment.perScreenAmount ? ` | ${money(summary.assignment.perScreenAmount)}/screen` : ""}` : "Assign this vendor's commission", to: path("details") });
  if (type === "reseller") {
    checks.push({ title: "Pricing and billing", done: summary.pricingConfigured && summary.billingConfigured, note: summary.pricingConfigured && summary.billingConfigured ? "Configured" : "Admin configuration required", to: path("details") });
    if (summary.prepaymentStatus && summary.prepaymentStatus !== "not_required") checks.push({ title: "Prepayment", done: summary.prepaymentStatus === "done", note: label(summary.prepaymentStatus), to: path("details") });
  }
  checks.push({ title: "Account activation", done: partner.status === "active", note: partner.status === "active" ? "Active" : label(partner.status), to: path("details") });
  const accounts = partner.socialAccounts || [];
  if (type === "influencer") {
    accounts.forEach((a) => checks.push({ title: `${label(a.platform)} ${a.username || a.accountId}`, done: a.reviewStatus === "verified" && !!(a.paymentRates?.post || a.paymentRates?.reel), note: a.reviewStatus !== "verified" ? `Account ${label(a.reviewStatus || "pending")}` : !(a.paymentRates?.post || a.paymentRates?.reel) ? "Set post/reel payment rates" : "Verified with payment rates", to: path("accounts") }));
    if (!accounts.length) checks.push({ title: "Social account", done: false, note: "Connect an account for review", to: path("accounts") });
    if (summary.posts?.pending?.count) checks.push({ title: "Post/reel approval", done: false, note: `${summary.posts.pending.count} waiting for review`, to: path("posts") });
  }
  if (type === "affiliate") {
    const pending = Object.entries(summary.leads || {}).filter(([status]) => !["won", "lost", "rejected"].includes(status)).reduce((n, [, row]) => n + row.count, 0);
    if (pending) checks.push({ title: "Lead decisions", done: false, note: `${pending} open deals`, to: path("leads") });
  }
  if (type === "reseller" && summary.orders?.requested?.count) checks.push({ title: "Licence orders", done: false, note: `${summary.orders.requested.count} awaiting approval`, to: path("details") });
  if (summary.earnings?.pending?.count) checks.push({ title: "Earnings approval", done: false, note: `${summary.earnings.pending.count} pending`, to: path("rewards") });
  if (summary.pendingCommissionPayments) checks.push({ title: "Commission recovery", done: false, note: `${summary.pendingCommissionPayments} paid payments awaiting commission`, to: path("details") });
  const pending = checks.filter((check) => !check.done);
  const next = pending[0];
  if (compact) return <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
    <div><p className="text-sm font-semibold">{next ? `Next: ${next.title}` : "Verification checklist complete"}</p><p className="text-xs text-slate-500 mt-1">{next ? next.note : "No outstanding items in this checklist."} {pending.length > 0 ? `(${pending.length} items need attention)` : ""}</p></div>
    <Link to={next?.to || path("overview")} className="text-sm font-semibold text-brand-red">{next ? "Open next step" : "View overview"}</Link>
  </Card>;
  const earned = amount(Object.fromEntries(Object.entries(summary.earnings || {}).filter(([status]) => status !== "cancelled")));
  const paid = summary.earnings?.settled?.amount || 0;
  let business = 0, successes, note;
  const tiles = [];
  if (type === "affiliate") {
    business = summary.leads?.won?.amount || 0; successes = summary.leads?.won?.count || 0;
    note = "Recorded value of won deals; this is not collected revenue.";
    tiles.push(["Total leads", count(summary.leads), "leads"], ["Won deals", successes, "leads"], ["Pending deals", Object.entries(summary.leads || {}).filter(([s]) => !["won", "lost", "rejected"].includes(s)).reduce((n, [, r]) => n + r.count, 0), "leads"], ["Rejected/lost", (summary.leads?.rejected?.count || 0) + (summary.leads?.lost?.count || 0), "leads"], ["Business referred", money(business), "leads"]);
  } else if (type === "influencer") {
    successes = summary.posts?.approved?.count || 0; note = "Contribution is measured by approved content; sales attribution is not recorded.";
    tiles.push(["Approved posts/reels", successes, "posts"], ["Pending posts/reels", summary.posts?.pending?.count || 0, "posts"], ["Rejected posts/reels", summary.posts?.rejected?.count || 0, "posts"], ["Instagram submissions", summary.platforms?.instagram?.count || 0, "posts"], ["Verified social accounts", accounts.filter((a) => a.reviewStatus === "verified").length, "accounts"]);
  } else if (type === "vendor") {
    business = summary.payments?.paid?.amount || 0; successes = summary.customers?.active?.count || 0;
    note = "Recorded paid customer receipts. Online receipts include tax; commission uses the online payment amount before tax.";
    tiles.push(["Customers", count(summary.customers), "customers"], ["Active customers", successes, "customers"], ["Active screens", summary.customers?.active?.amount || 0, "customers"], ["Customer payments", money(business), "customers"]);
  } else {
    business = summary.invoices?.paid?.amount || 0; successes = summary.inventory?.totalPurchasedLicenses || 0;
    note = "Paid licence invoices including tax; outstanding invoices are shown separately.";
    tiles.push(["Customers", count(summary.customers), "customers"], ["Active customers", summary.customers?.active?.count || 0, "customers"], ["Licences purchased", successes, "details"], ["Licences allocated", summary.inventory?.totalAllocatedLicenses || 0, "details"], ["Business paid", money(business), "details"], ["Invoices outstanding", money(amount(Object.fromEntries(Object.entries(summary.invoices || {}).filter(([s]) => s !== "paid")))), "details"]);
  }
  if (type !== "reseller") tiles.push(["Commission/rewards earned", money(earned), "rewards"], ["Paid to partner", money(paid), "settlements"], ["Still to pay", money(earned - paid), "settlements"]);
  const great = type === "influencer" ? successes >= 10 : business >= 100000;
  const rating = great ? "\u{1F31F} Great contribution" : successes || business ? "\u{1F4C8} Business is growing" : "\u{1F331} Getting started";
  return <div className="space-y-4">
    <Card className="p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">Verification and approvals</h2><Badge status={partner.verification?.overallStatus || "not_submitted"} /></div>
      <p className="text-sm text-slate-500 mt-1">{checks.filter((c) => !c.done).length} items need attention. Account: {label(partner.status)}.</p>
      {next && <div className="mt-4 p-4 rounded-xl bg-slate-50 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-sm">Start here: {next.title}</p><p className="text-sm text-slate-500 mt-1">{next.note}</p></div><Link to={next.to} className="px-4 py-2 rounded-lg bg-brand-red text-white text-sm font-semibold">Open next step</Link></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">{pending.map((c) => <Link key={c.title} to={c.to} className={`rounded-xl border p-3 ${c.done ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}><p className="text-sm font-medium">{c.done ? "\u2713" : "\u25CB"} {c.title}</p><p className="text-xs text-slate-600 mt-1">{c.note}</p></Link>)}</div>
      {checks.some((c) => c.done) && <details className="mt-4"><summary className="cursor-pointer text-sm text-emerald-700">View {checks.filter((c) => c.done).length} completed checks</summary><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">{checks.filter((c) => c.done).map((c) => <Link key={c.title} to={c.to} className="rounded-lg bg-emerald-50 p-3 text-sm">{c.title}<span className="block text-xs text-slate-500 mt-1">{c.note}</span></Link>)}</div></details>}
    </Card>
    {!compact && <>
      <Card className="p-5"><h2 className="font-semibold">{rating}</h2><p className="text-sm text-slate-500 mt-1">{note}</p><p className="text-xs text-slate-400 mt-2">Indicator uses lifetime totals: great contribution means {type === "influencer" ? "10 approved posts/reels" : "INR 100,000 of recorded business"} or more.</p></Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{tiles.map(([title, value, section]) => <Link key={title} to={path(section)}><Card className="p-4 h-full"><p className="text-xs text-slate-500">{title}</p><p className="text-xl font-bold mt-2">{value}</p></Card></Link>)}</div>
    </>}
  </div>;
}
