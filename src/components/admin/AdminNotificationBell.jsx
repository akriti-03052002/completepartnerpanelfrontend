import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, FileCheck, Landmark, Share2, Clapperboard, Receipt, ChevronRight } from "lucide-react";
import adminApi from "../../services/adminApi";

// How often the bell checks for new activity while the admin panel is open.
const POLL_MS = 60 * 1000;

const TYPE_ICON = {
  influencer_registered: UserPlus,
  document_uploaded: FileCheck,
  bank_submitted: Landmark,
  social_account_submitted: Share2,
  social_account_connected: Share2,
  content_submitted: Clapperboard,
  bill_submitted: Receipt
};

const timeAgo = (date) => {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days} day${days === 1 ? "" : "s"} ago` : new Date(date).toLocaleDateString();
};

/** "What's new" for admins — influencer actions waiting for review. */
export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, setPending] = useState({ posts: 0, accounts: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => (
    adminApi.get("/admin/notifications")
      .then((res) => {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
        setPending(res.data.data.pending || { posts: 0, accounts: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  ), []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const openNotification = async (n) => {
    setOpen(false);
    if (!n.read) {
      await adminApi.patch(`/admin/notifications/${n._id}/read`).catch(() => {});
      load();
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    await adminApi.patch("/admin/notifications/read-all").catch(() => {});
    load();
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-brand-black transition"
        aria-label={unreadCount ? `Notifications, ${unreadCount} new` : "Notifications"}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-bold leading-[18px] text-center border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">
                What&apos;s new {unreadCount > 0 && <span className="text-slate-400 font-normal">· {unreadCount} unread</span>}
              </p>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs font-semibold text-brand-red hover:underline">
                  Mark all as read
                </button>
              )}
            </div>

            {[
              { key: "posts", count: pending.posts, label: (n) => `${n} post${n === 1 ? "" : "s"}/reel${n === 1 ? "" : "s"} to review`, to: "/admin/social-media/posts", Icon: Clapperboard },
              { key: "accounts", count: pending.accounts, label: (n) => `${n} social account${n === 1 ? "" : "s"} to verify`, to: "/admin/social-media/accounts", Icon: Share2 }
            ].filter((row) => row.count > 0).map(({ key, count, label, to, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setOpen(false); navigate(to); }}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 bg-amber-50 border-b border-amber-100 hover:bg-amber-100/60"
              >
                <span className="w-8 h-8 shrink-0 rounded-lg grid place-items-center bg-amber-100 text-amber-700"><Icon size={15} /></span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-amber-900">{label(count)}</span>
                <ChevronRight size={16} className="text-amber-700" />
              </button>
            ))}

            <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <p className="text-sm text-slate-400 p-4">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-slate-400 p-6 text-center">Nothing new. Influencer sign-ups, KYC uploads, bank details, social accounts and posts will show up here.</p>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell;
                  return (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-slate-50 ${!n.read ? "bg-brand-red/5" : ""}`}
                    >
                      <span className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg grid place-items-center ${!n.read ? "bg-brand-red/10 text-brand-red" : "bg-slate-100 text-slate-400"}`}>
                        <Icon size={15} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{n.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">{n.message}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
