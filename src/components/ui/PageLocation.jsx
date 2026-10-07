import { Link, useLocation } from "react-router-dom";

const labels = {
  partners: "Partners", reseller: "Reseller", customers: "Customers", screens: "Screens",
  documents: "Documents", bank: "Bank account", profile: "Profile", details: "Profile details",
  billing: "Billing", subscription: "Subscription", commissions: "Earnings", settlements: "Payments",
  "licence-payments": "Licence payments", inventory: "Screen licences", buy: "Request licences",
  "social-media": "Social media", "post-reel": "Posts & reels", team: "Team", activity: "Activity",
  leads: "Leads & deals", deals: "Leads & deals", rewards: "Rewards & earnings", kyc: "Documents & bank",
  payout: "Payment settings", notifications: "Notifications", posts: "Review posts", accounts: "Review accounts"
};
export default function PageLocation() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2 || parts.at(-1) === "dashboard") return null;
  const base = parts[0] === "admin" ? "/admin/dashboard" : parts[0] === "partner" ? "/partner/dashboard" : parts[0] === "customer" ? "/customer/dashboard" : "/reseller/customer/dashboard";
  const isId = value => /^[a-f\d]{24}$/i.test(value);
  const visible = parts.slice(parts[0] === "reseller" && parts[1] === "customer" ? 2 : 1).filter(part => !isId(part));
  return <nav aria-label="Your location" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600"><Link to={base} className="font-medium hover:underline">Dashboard</Link>{visible.map((part, index) => <span key={`${part}-${index}`} className="inline-flex items-center gap-2"><span aria-hidden="true">/</span><span aria-current={index === visible.length - 1 ? "page" : undefined}>{labels[part] || part.replaceAll("-", " ")}</span></span>)}</nav>;
}
