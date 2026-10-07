import PageGuide from "../components/ui/PageGuide";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Logo from "../components/ui/Logo";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminNotificationBell from "../components/admin/AdminNotificationBell";
import { ADMIN_NAV, isCurrent, activeTopKey, activeTypeKey } from "./adminNav";

const rowClass = (active, level = 0) =>
  `group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium transition ${
    level === 0 ? "text-[13px]" : "text-[12.5px]"
  } ${active ? "bg-white text-brand-black shadow-sm" : "text-white/65 hover:bg-white/8 hover:text-white"}`;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only one menu's sub-menu is open at a time, and only one partner type
  // under Partners. Both follow the page being shown, so opening a page
  // from anywhere (a link, a notification, the address bar) opens the menu
  // it belongs to; `collapsed` lets the admin fold the current one away.
  const currentTop = activeTopKey(location);
  // A partner's own page doesn't say its type in the address, so the page
  // reports it (see AdminPartnerDetail) and that type's menu stays open.
  const [viewedPartnerType, setViewedPartnerType] = useState(null);
  const onPartnerPage = location.pathname.startsWith("/admin/partners/");
  const currentType = activeTypeKey(location) || (onPartnerPage ? viewedPartnerType : null);
  const [collapsed, setCollapsed] = useState(null);
  const openTop = collapsed === currentTop ? null : currentTop;

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const closeMobile = () => setSidebarOpen(false);

  // Clicking a parent goes to its own page (which opens it); clicking the
  // parent that is already open folds it.
  const onParentClick = (item) => (event) => {
    if (currentTop === item.key && isCurrent(item.to, location)) {
      event.preventDefault();
      setCollapsed(collapsed === item.key ? null : item.key);
      return;
    }
    setCollapsed(null);
    closeMobile();
  };

  return (
    // Exactly one screen tall: the sidebar menu and the page content each
    // scroll on their own, so a long menu is always reachable.
    <div className="h-screen overflow-hidden flex bg-light-grey">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={closeMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 bg-brand-black text-white flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center">
            <Logo size="sm" dark />
            <span className="ml-3 border-l border-white/15 pl-3">
              <span className="block text-sm font-semibold text-white">Control Center</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">Unified Admin</span>
            </span>
          </div>
          <button aria-label="Close admin navigation" className="lg:hidden text-white/60 hover:text-white" onClick={closeMobile}>
            <X size={20} />
          </button>
        </div>

        {/* The menu and Log out scroll together, so scrolling the sidebar
            goes all the way down to Log out. When the menu is short, Log
            out still sits at the bottom. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
          <nav aria-label="Admin navigation" className="grow shrink-0 px-3 py-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              if (!item.children) {
                return (
                  <NavLink key={item.key} to={item.to} onClick={() => { setCollapsed(null); closeMobile(); }} className={() => rowClass(isCurrent(item.to, location))}>
                    <item.icon size={17} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </NavLink>
                );
              }

              const open = openTop === item.key;
              return (
                <div key={item.key}>
                  <NavLink
                    to={item.to}
                    onClick={onParentClick(item)}
                    aria-expanded={open}
                    className={() => rowClass(false)}
                  >
                    <item.icon size={17} className="shrink-0 opacity-80" />
                    <span className={`min-w-0 flex-1 truncate ${currentTop === item.key ? "text-white" : ""}`}>{item.label}</span>
                    <ChevronDown size={15} className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
                  </NavLink>

                  {open && (
                    <div className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-2">
                      {item.children.map((child) => {
                        // A plain page under this menu.
                        if (!child.children) {
                          return (
                            <NavLink key={child.to} to={child.to} onClick={closeMobile} className={() => rowClass(isCurrent(child.to, location), 1)}>
                              <span className="min-w-0 flex-1 truncate">{child.label}</span>
                            </NavLink>
                          );
                        }

                        // A partner type: its own pages show only while it is the open one.
                        const typeOpen = currentType === child.key;
                        return (
                          <div key={child.key}>
                            <NavLink to={child.to} onClick={closeMobile} aria-expanded={typeOpen} className={() => rowClass(false, 1)}>
                              <child.icon size={15} className="shrink-0 opacity-70" />
                              <span className={`min-w-0 flex-1 truncate ${typeOpen ? "text-white" : ""}`}>{child.label}</span>
                              <ChevronDown size={14} className={`shrink-0 opacity-60 transition-transform ${typeOpen ? "rotate-180" : ""}`} />
                            </NavLink>
                            {typeOpen && (
                              <div className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-2">
                                {child.children.map((page) => (
                                  <NavLink key={page.to} to={page.to} onClick={closeMobile} className={() => rowClass(isCurrent(page.to, location) || (onPartnerPage && page.to.startsWith("/admin/partners?")), 1)}>
                                    <span className="min-w-0 flex-1 truncate">{page.label}</span>
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <button aria-label="Open admin navigation" className="lg:hidden text-slate-500 hover:text-brand-black" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <AdminNotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageGuide />
          <Outlet context={{ setViewedPartnerType }} />
        </main>
      </div>
    </div>
  );
}
