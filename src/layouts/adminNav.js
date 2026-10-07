import {
  LayoutDashboard, Bell, Building2, Wallet, Receipt, Landmark, FileCheck, SlidersHorizontal,
  Share2, Target, ShoppingBag, PackageSearch
} from "lucide-react";

// The admin menu. A menu with `children` is a parent: its sub-menu is only
// shown while that parent is the one open (clicking it opens it and goes to
// its own page). Partner types under "Partners" are parents themselves,
// each with that type's own pages.
//
// Creating a partner lives on "All Partners" only — never on a type's page.

const PARTNER_TYPE_MENUS = [
  {
    key: "influencer",
    label: "Influencer",
    icon: Share2,
    to: "/admin/overview/influencer",
    prefixes: ["/admin/overview/influencer", "/admin/social-media", "/admin/agreement"],
    children: [
      { to: "/admin/overview/influencer", label: "Overview" },
      { to: "/admin/social-media/posts", label: "Post / Reel Approval" },
      { to: "/admin/social-media/accounts", label: "Account Approval" },
      { to: "/admin/partners?partnerType=influencer", label: "Influencers" },
      { to: "/admin/agreement", label: "Influencer Agreement" }
    ]
  },
  {
    key: "reseller",
    label: "Reseller",
    icon: PackageSearch,
    to: "/admin/overview/reseller",
    prefixes: ["/admin/overview/reseller", "/admin/reseller"],
    children: [
      { to: "/admin/overview/reseller", label: "Overview" },
      { to: "/admin/reseller", label: "Licences & Billing" },
      { to: "/admin/reseller/customers", label: "Customers" },
      { to: "/admin/partners?partnerType=reseller", label: "Resellers" }
    ]
  },
  {
    key: "affiliate",
    label: "Affiliate",
    icon: Target,
    to: "/admin/overview/affiliate",
    prefixes: ["/admin/overview/affiliate", "/admin/leads"],
    children: [
      { to: "/admin/overview/affiliate", label: "Overview" },
      { to: "/admin/leads", label: "Leads" },
      { to: "/admin/partners?partnerType=affiliate", label: "Affiliates" }
    ]
  },
  {
    key: "vendor",
    label: "Vendor",
    icon: ShoppingBag,
    to: "/admin/overview/vendor",
    prefixes: ["/admin/overview/vendor", "/admin/customers"],
    children: [
      { to: "/admin/overview/vendor", label: "Overview" },
      { to: "/admin/customers", label: "Customers" },
      { to: "/admin/partners?partnerType=vendor", label: "Vendors" }
    ]
  }
];

// The types that are paid by SPOTX. A Reseller pays SPOTX instead (see
// "Payment from Licence"), so it has no commission or settlement.
const EARNING_TYPES = [
  { type: "influencer", label: "Influencer" },
  { type: "affiliate", label: "Affiliate" },
  { type: "vendor", label: "Vendor" }
];

export const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { key: "notifications", label: "Notifications", icon: Bell, to: "/admin/notifications" },
  {
    key: "partners",
    label: "Partners",
    icon: Building2,
    to: "/admin/partners",
    prefixes: ["/admin/partners", "/admin/overview", "/admin/social-media", "/admin/agreement", "/admin/leads", "/admin/customers", "/admin/reseller"],
    children: [
      { to: "/admin/partners", label: "All Partners" },
      ...PARTNER_TYPE_MENUS
    ]
  },
  {
    key: "commission",
    label: "Commission",
    icon: Wallet,
    to: "/admin/commissions",
    prefixes: ["/admin/commissions"],
    children: [
      { to: "/admin/commissions", label: "All Commission" },
      ...EARNING_TYPES.map(({ type, label }) => ({ to: `/admin/commissions?partnerType=${type}`, label }))
    ]
  },
  { key: "licence", label: "Payment from Licence", icon: Receipt, to: "/admin/licence-payments" },
  {
    key: "settlement",
    label: "Partner Payments",
    icon: Landmark,
    to: "/admin/settlements",
    prefixes: ["/admin/settlements"],
    children: [
      { to: "/admin/settlements", label: "All Partner Payments" },
      ...EARNING_TYPES.map(({ type, label }) => ({ to: `/admin/settlements?partnerType=${type}`, label }))
    ]
  },
  { key: "kyc", label: "Identity Review (KYC)", icon: FileCheck, to: "/admin/documents" },
  { key: "bank", label: "Bank Review", icon: Landmark, to: "/admin/bank" },
  { key: "config", label: "Screen Pricing", icon: SlidersHorizontal, to: "/admin/config" }
];

const typeIn = (search) => new URLSearchParams(search).get("partnerType") || "";

// Is this exact menu entry the page being shown? A link with ?partnerType=
// only matches that type; one without only matches when no type is chosen.
export const isCurrent = (to, location) => {
  const [path, query = ""] = to.split("?");
  return location.pathname === path && typeIn(`?${query}`) === typeIn(location.search);
};

const underPrefix = (prefixes, location) =>
  (prefixes || []).some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));

// Which top-level menu the current page belongs to.
export const activeTopKey = (location) => {
  const hit = ADMIN_NAV.find((item) => (item.children ? underPrefix(item.prefixes, location) : isCurrent(item.to, location)));
  return hit?.key || null;
};

// Which partner type (under Partners) the current page belongs to, if any.
export const activeTypeKey = (location) => {
  const listType = location.pathname === "/admin/partners" ? typeIn(location.search) : "";
  if (listType) return listType;
  return PARTNER_TYPE_MENUS.find((menu) => underPrefix(menu.prefixes, location))?.key || null;
};
