import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PartnerAuthProvider, usePartnerAuth } from "./context/PartnerAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";

import PartnerLayout from "./layouts/PartnerLayout";
import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import VerifiedGate from "./components/partner/VerifiedGate";
import ErrorBoundary from "./components/ErrorBoundary";

const Landing = lazy(() => import("./pages/Landing"));
const CustomerRegister = lazy(() => import("./pages/CustomerRegister"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));

// Customer app pages
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const CustomerProfile = lazy(() => import("./pages/customer/Profile"));
const CustomerBilling = lazy(() => import("./pages/customer/Billing"));
const CustomerScreens = lazy(() => import("./pages/customer/Screens"));
const CustomerSubscription = lazy(() => import("./pages/customer/Subscription"));

// Partner auth pages
const PartnerRegister = lazy(() => import("./pages/Partnerregister"));
const PartnerLogin = lazy(() => import("./pages/Partnerlogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CustomerForgotPassword = lazy(() => import("./pages/CustomerForgotPassword"));
const CustomerResetPassword = lazy(() => import("./pages/CustomerResetPassword"));

// Partner app pages
const Dashboard = lazy(() => import("./pages/partner/Dashboard"));
const Leads = lazy(() => import("./pages/partner/Leads"));
const Customers = lazy(() => import("./pages/partner/Customers"));
const Commissions = lazy(() => import("./pages/partner/Commissions"));
const Settlements = lazy(() => import("./pages/partner/Settlements"));
const Documents = lazy(() => import("./pages/partner/Documents"));
const Bank = lazy(() => import("./pages/partner/Bank"));
const Notifications = lazy(() => import("./pages/partner/Notifications"));
const Profile = lazy(() => import("./pages/partner/Profile"));
const Team = lazy(() => import("./pages/partner/Team"));
const SocialMedia = lazy(() => import("./pages/partner/SocialMedia"));
const PostReel = lazy(() => import("./pages/partner/PostReel"));
const ResellerInventory = lazy(() => import("./pages/partner/reseller/ResellerInventory"));
const ResellerBuyLicenses = lazy(() => import("./pages/partner/reseller/ResellerBuyLicenses"));
const ResellerCustomers = lazy(() => import("./pages/partner/reseller/ResellerCustomers"));
const ResellerBilling = lazy(() => import("./pages/partner/reseller/ResellerBilling"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminTypeOverview = lazy(() => import("./pages/admin/AdminTypeOverview"));
const AdminLicencePayments = lazy(() => import("./pages/admin/AdminLicencePayments"));
const AdminPartnerDetail = lazy(() => import("./pages/admin/AdminPartnerDetail"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminBank = lazy(() => import("./pages/admin/AdminBank"));
const AdminCommissions = lazy(() => import("./pages/admin/AdminCommissions"));
const AdminSettlements = lazy(() => import("./pages/admin/AdminSettlements"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));
const AdminResellerDashboard = lazy(() => import("./pages/admin/AdminResellerDashboard"));
const AdminResellerCustomers = lazy(() => import("./pages/admin/AdminResellerCustomers"));
const AdminSocialMedia = lazy(() => import("./pages/admin/AdminSocialMedia"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminAgreement = lazy(() => import("./pages/admin/AdminAgreement"));
const ResellerCustomerPortalLogin = lazy(() => import("./pages/ResellerCustomerPortalLogin"));
const ResellerCustomerPortalDashboard = lazy(() => import("./pages/ResellerCustomerPortalDashboard"));
const ResellerCustomerReferralRegister = lazy(() => import("./pages/ResellerCustomerReferralRegister"));
const ResellerCustomerVerifyAndSetPassword = lazy(() => import("./pages/ResellerCustomerVerifyAndSetPassword"));
const ResellerCustomerScreens = lazy(() => import("./pages/ResellerCustomerScreens"));
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

function PartnerTypeRoute({ type, children }) {
  const { partner } = usePartnerAuth();
  const allowedTypes = Array.isArray(type) ? type : [type];
  return allowedTypes.includes(partner?.partnerType?.toLowerCase())
    ? children
    : <Navigate to="/partner/dashboard" replace />;
}

// ======================================================
// PARTNER ROUTE GUARDS
// ======================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("partnerToken");
  if (!token) return <Navigate to="/partner/login" replace />;
  return children;
}

function PartnerRouteRoot() {
  const { pathname } = useLocation();
  if (pathname === "/partner" || pathname === "/partner/") return <Landing />;
  return <ProtectedRoute><PartnerLayout /></ProtectedRoute>;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("partnerToken");
  if (token) return <Navigate to="/partner/dashboard" replace />;
  return children;
}

// ======================================================
// ADMIN ROUTE GUARDS
// ======================================================

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function AdminPublicRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  if (token) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

// ======================================================
// CUSTOMER ROUTE GUARDS
// ======================================================

function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem("customerToken");
  if (!token) return <Navigate to="/customer/login" replace />;
  return children;
}

function CustomerPublicRoute({ children }) {
  const token = localStorage.getItem("customerToken");
  if (token) return <Navigate to="/customer/dashboard" replace />;
  return children;
}

function ResellerCustomerProtectedRoute({ children }) {
  const token = localStorage.getItem("customerPortalToken");
  if (!token) return <Navigate to="/reseller/customer/login" replace />;
  return children;
}

function ResellerCustomerPortalLayout() {
  const logout = () => {
    localStorage.removeItem("customerPortalToken");
    queryClient.clear();
    window.location.assign("/reseller/customer/login");
  };

  return (
    <div className="min-h-screen bg-light-grey">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link to="/reseller/customer/dashboard" className="text-slate-700 hover:text-brand-red">Account</Link>
            <Link to="/reseller/customer/screens" className="text-slate-700 hover:text-brand-red">Screens</Link>
          </nav>
          <button type="button" onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">Log out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 sm:p-6"><Outlet /></main>
    </div>
  );
}

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PartnerAuthProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
          <Routes>
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/reseller/customer/register" element={<ResellerCustomerReferralRegister />} />
            <Route path="/reseller/customer/verify/:token" element={<ResellerCustomerVerifyAndSetPassword />} />
            <Route path="/reseller/customer/login" element={<ResellerCustomerPortalLogin />} />
            <Route path="/reseller/customer" element={<ResellerCustomerProtectedRoute><ResellerCustomerPortalLayout /></ResellerCustomerProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ResellerCustomerPortalDashboard />} />
              <Route path="screens" element={<ResellerCustomerScreens />} />
            </Route>
            <Route path="/customer/register" element={<CustomerRegister />} />

            {/* CUSTOMER AUTH */}
            <Route path="/customer/login" element={<CustomerPublicRoute><CustomerLogin /></CustomerPublicRoute>} />
            <Route path="/customer/forgot-password" element={<CustomerPublicRoute><CustomerForgotPassword /></CustomerPublicRoute>} />
            <Route path="/customer/reset-password/:token" element={<CustomerPublicRoute><CustomerResetPassword /></CustomerPublicRoute>} />

            {/* CUSTOMER APP */}
            <Route path="/customer" element={<CustomerProtectedRoute><CustomerLayout /></CustomerProtectedRoute>}>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="screens" element={<CustomerScreens />} />
              <Route path="subscription" element={<CustomerSubscription />} />
              <Route path="billing" element={<CustomerBilling />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            {/* PARTNER AUTH */}
            <Route path="/partner/register" element={<PublicRoute><PartnerRegister /></PublicRoute>} />
            <Route path="/partner/login" element={<PublicRoute><PartnerLogin /></PublicRoute>} />
            <Route path="/partner/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/partner/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* PARTNER APP */}
            <Route path="/partner" element={<PartnerRouteRoot />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="deals" element={<PartnerTypeRoute type="affiliate"><VerifiedGate><Leads /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="leads" element={<PartnerTypeRoute type="affiliate"><Navigate to="/partner/deals" replace /></PartnerTypeRoute>} />
              <Route path="referrals" element={<PartnerTypeRoute type="affiliate"><Navigate to="/partner/deals" replace /></PartnerTypeRoute>} />
              <Route path="opportunities" element={<PartnerTypeRoute type="affiliate"><Navigate to="/partner/deals" replace /></PartnerTypeRoute>} />
              <Route path="customers" element={<PartnerTypeRoute type="vendor"><VerifiedGate><Customers /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="commissions" element={<PartnerTypeRoute type={["influencer", "affiliate", "vendor"]}><VerifiedGate><Commissions /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="settlements" element={<PartnerTypeRoute type={["influencer", "affiliate", "vendor"]}><VerifiedGate><Settlements /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="documents" element={<Documents />} />
              <Route path="bank" element={<Bank />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="team" element={<PartnerTypeRoute type={["affiliate", "vendor", "reseller"]}><VerifiedGate><Team /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="social-media" element={<PartnerTypeRoute type="influencer"><SocialMedia /></PartnerTypeRoute>} />
              <Route path="post-reel" element={<PartnerTypeRoute type="influencer"><PostReel /></PartnerTypeRoute>} />

              {/* Reseller-only inventory, customer assignment, and billing. */}
              <Route path="reseller/inventory" element={<PartnerTypeRoute type="reseller"><VerifiedGate><ResellerInventory /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="reseller/buy" element={<PartnerTypeRoute type="reseller"><VerifiedGate><ResellerBuyLicenses /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="reseller/customers" element={<PartnerTypeRoute type="reseller"><VerifiedGate><ResellerCustomers /></VerifiedGate></PartnerTypeRoute>} />
              <Route path="reseller/billing" element={<PartnerTypeRoute type="reseller"><VerifiedGate><ResellerBilling /></VerifiedGate></PartnerTypeRoute>} />
            </Route>

            {/* ADMIN AUTH */}
            <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />

            {/* ADMIN APP */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="overview/:partnerType" element={<AdminTypeOverview />} />
              <Route path="licence-payments" element={<AdminLicencePayments />} />
              <Route path="partners/:id" element={<AdminPartnerDetail />} />
              <Route path="partners/:id/:section" element={<AdminPartnerDetail />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="bank" element={<AdminBank />} />
              <Route path="opportunities" element={<Navigate to="/admin/leads" replace />} />
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="settlements" element={<AdminSettlements />} />
              <Route path="reseller" element={<AdminResellerDashboard />} />
              <Route path="reseller/customers" element={<AdminResellerCustomers />} />
              <Route path="config" element={<AdminConfig />} />
              <Route path="social-media/accounts" element={<AdminSocialMedia view="accounts" />} />
              <Route path="social-media/posts" element={<AdminSocialMedia view="posts" />} />
              <Route path="agreement" element={<AdminAgreement />} />
              <Route path="leads" element={<AdminLeads />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          <Toaster position="top-right" />
            </BrowserRouter>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </PartnerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
