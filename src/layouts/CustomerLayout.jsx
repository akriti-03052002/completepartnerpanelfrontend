import PageGuide from "../components/ui/PageGuide";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Receipt, Monitor, CreditCard, LogOut, Menu, X } from "lucide-react";
import Logo from "../components/ui/Logo";
import { useCustomerAuth } from "../context/CustomerAuthContext";

const NAV_ITEMS = [
  { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customer/screens", label: "Screens", icon: Monitor },
  { to: "/customer/subscription", label: "Subscription", icon: CreditCard },
  { to: "/customer/billing", label: "Billing", icon: Receipt },
  { to: "/customer/profile", label: "Profile", icon: UserCircle }
];

export default function CustomerLayout() {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch (error) { window.alert(error.message); return; }
    navigate("/customer/login", { replace: true });
  };

  return (
    <div className="h-screen overflow-hidden flex bg-light-grey">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Logo size="sm" />
          <button className="lg:hidden text-slate-500 hover:text-brand-black" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* The menu and Log out scroll together, so scrolling the sidebar
            goes all the way down to Log out. When the menu is short, Log
            out still sits at the bottom. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
        <nav className="grow shrink-0 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? "bg-brand-black text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 gap-3">
          <button className="lg:hidden text-slate-500 hover:text-brand-black shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{customer?.companyName}</p>
            <p className="text-xs text-slate-400 truncate">{customer?.email}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageGuide />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
