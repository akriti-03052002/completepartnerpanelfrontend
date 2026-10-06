import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ChevronRight } from "lucide-react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { notificationLink } from "../../utils/notificationLink";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { visible, toolbar } = useListFilter(notifications, [
    { label: "Read", value: (n) => (n.read ? "Read" : "Unread") },
    { label: "About", value: (n) => n.type }
  ]);
  const navigate = useNavigate();
  const { partner } = usePartnerAuth();

  // Opening a notification marks it read and goes to the page for the
  // thing it is about (the lead, post / reel, earning, invoice…).
  const open = async (n) => {
    if (!n.read) await api.patch(`/partner/notifications/${n._id}/read`).catch(() => {});
    navigate(notificationLink(n, partner?.partnerType?.toLowerCase()));
  };

  const load = () => api.get("/partner/notifications").then((res) => setNotifications(res.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.patch("/partner/notifications/read-all");
    load();
  };

  const markRead = async (id) => {
    await api.patch(`/partner/notifications/${id}/read`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <Button variant="outline" onClick={markAllRead}>Mark all as read</Button>
      </div>

      <ListToolbar toolbar={toolbar} placeholder="Search notifications" />

      <Card className="divide-y divide-slate-100">
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-slate-400 text-sm p-6 text-center">No notifications yet.</p>
        ) : visible.length === 0 ? (
          <p className="text-slate-400 text-sm p-6 text-center">Nothing matches your search or filters.</p>
        ) : (
          visible.map((n) => (
            <div key={n._id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-brand-red/5" : ""}`}>
              <Bell size={16} className="text-slate-400 mt-1 shrink-0" />
              <button type="button" onClick={() => open(n)} className="flex-1 min-w-0 text-left group">
                <p className="text-sm font-medium text-slate-900 group-hover:underline">{n.title}</p>
                <p className="text-sm text-slate-500">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </button>
              {!n.read && (
                <button type="button" onClick={() => markRead(n._id)} className="text-slate-400 hover:text-brand-red" aria-label="Mark as read">
                  <Check size={16} />
                </button>
              )}
              <button type="button" onClick={() => open(n)} className="text-slate-300 hover:text-slate-600" aria-label="Open">
                <ChevronRight size={16} />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
