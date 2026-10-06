import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ChevronRight } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.get("/admin/notifications")
      .then((response) => {
        if (active) setNotifications(response.data.data.notifications);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load admin notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await adminApi.get("/admin/notifications");
      setNotifications(response.data.data.notifications);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load admin notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = async () => {
    setError("");
    try {
      await adminApi.patch("/admin/notifications/read-all");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark notifications as read.");
    }
  };

  const markRead = async (id) => {
    setError("");
    try {
      await adminApi.patch(`/admin/notifications/${id}/read`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark the notification as read.");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) await markRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const hasUnread = notifications.some((notification) => !notification.read);
  const { visible, toolbar } = useListFilter(notifications, [
    { label: "Read", value: (n) => (n.read ? "Read" : "Unread") },
    { label: "About", value: (n) => n.type }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Review activity and actions across partner programs.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={!hasUnread}>Mark all as read</Button>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <ListToolbar toolbar={toolbar} placeholder="Search notifications" />

      <Card className="divide-y divide-slate-100">
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-slate-400 text-sm p-6 text-center">No notifications yet.</p>
        ) : visible.length === 0 ? (
          <p className="text-slate-400 text-sm p-6 text-center">Nothing matches your search or filters.</p>
        ) : (
          visible.map((notification) => (
            <div key={notification._id} className={`flex items-start gap-3 ${!notification.read ? "bg-brand-red/5" : ""}`}>
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className="flex-1 min-w-0 flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition"
              >
                <Bell size={16} className="text-slate-400 mt-1 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-900">{notification.title}</span>
                  <span className="block text-sm text-slate-500">{notification.message}</span>
                  <span className="block text-xs text-slate-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</span>
                </span>
                {notification.link && <ChevronRight size={16} className="text-slate-300 mt-1 shrink-0" />}
              </button>
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => markRead(notification._id)}
                  className="text-slate-400 hover:text-brand-red p-4"
                  aria-label="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
