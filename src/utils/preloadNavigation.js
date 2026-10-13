// Download only the page a user is about to open; never preload account data.
const pages = {
  "/admin": () => import("../pages/admin/AdminDashboard"),
  "/admin/reseller": () => import("../pages/admin/AdminResellerDashboard"),
  "/admin/agreement": () => import("../pages/admin/AdminAgreement"),
  "/admin/overview/vendor": () => import("../pages/admin/AdminTypeOverview"),
  "/admin/overview/affiliate": () => import("../pages/admin/AdminTypeOverview"),
  "/admin/overview/influencer": () => import("../pages/admin/AdminTypeOverview"),
  "/admin/overview/reseller": () => import("../pages/admin/AdminTypeOverview"),
  "/customer/dashboard": () => import("../pages/customer/Dashboard"),
  "/customer/profile": () => import("../pages/customer/Profile"),
  "/customer/screens": () => import("../pages/customer/Screens"),
  "/customer/subscription": () => import("../pages/customer/Subscription"),
  "/customer/billing": () => import("../pages/customer/Billing"),
  "/partner/dashboard": () => import("../pages/partner/Dashboard"),
  "/partner/profile": () => import("../pages/partner/Profile"),
  "/partner/team": () => import("../pages/partner/Team"),
  "/partner/commissions": () => import("../pages/partner/Commissions"),
  "/partner/settlements": () => import("../pages/partner/Settlements"),
  "/partner/documents": () => import("../pages/partner/Documents"),
  "/partner/bank": () => import("../pages/partner/Bank"),
  "/partner/customers": () => import("../pages/partner/Customers"),
  "/partner/deals": () => import("../pages/partner/Leads"),
  "/partner/notifications": () => import("../pages/partner/Notifications"),
  "/partner/social-media": () => import("../pages/partner/SocialMedia"),
  "/partner/post-reel": () => import("../pages/partner/PostReel"),
  "/partner/reseller/inventory": () => import("../pages/partner/reseller/ResellerInventory"),
  "/partner/reseller/buy": () => import("../pages/partner/reseller/ResellerBuyLicenses"),
  "/partner/reseller/customers": () => import("../pages/partner/reseller/ResellerCustomers"),
  "/partner/reseller/billing": () => import("../pages/partner/reseller/ResellerBilling"),
  "/admin/dashboard": () => import("../pages/admin/AdminDashboard"),
  "/admin/partners": () => import("../pages/admin/AdminPartners"),
  "/admin/customers": () => import("../pages/admin/AdminCustomers"),
  "/admin/documents": () => import("../pages/admin/AdminDocuments"),
  "/admin/bank": () => import("../pages/admin/AdminBank"),
  "/admin/commissions": () => import("../pages/admin/AdminCommissions"),
  "/admin/settlements": () => import("../pages/admin/AdminSettlements"),
  "/admin/config": () => import("../pages/admin/AdminConfig"),
  "/admin/licence-payments": () => import("../pages/admin/AdminLicencePayments"),
  "/admin/leads": () => import("../pages/admin/AdminLeads"),
  "/admin/notifications": () => import("../pages/admin/AdminNotifications"),
  "/admin/reseller/dashboard": () => import("../pages/admin/AdminResellerDashboard"),
  "/admin/reseller/customers": () => import("../pages/admin/AdminResellerCustomers"),
  "/admin/social-media/accounts": () => import("../pages/admin/AdminSocialMedia"),
  "/admin/social-media/posts": () => import("../pages/admin/AdminSocialMedia"),
  "/reseller/customer/dashboard": () => import("../pages/ResellerCustomerPortalDashboard"),
  "/reseller/customer/screens": () => import("../pages/ResellerCustomerScreens"),
};
const pending = new Map();
export function preloadNavigation(event) {
  if (navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || "")) return;
  const link = event.target.closest?.("a[href]");
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  const path = url.pathname.replace(/\/$/, "");
  if (!pages[path] || pending.has(path)) return;
  pending.set(path, pages[path]().catch(() => pending.delete(path)));
}
