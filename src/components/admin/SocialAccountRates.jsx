import { useState } from "react";
import { Pencil } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const PLATFORM_LABEL = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
const money = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "Not paid");

/**
 * Every social account of one influencer with its agreed post/reel price.
 * This is where prices are changed once an account has been verified and
 * priced — the Accounts & Posts review queue only shows accounts still
 * waiting on verification or a first price.
 */
export default function SocialAccountRates({ partnerId, accounts, onSaved }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ post: "", reel: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const startEdit = (account) => {
    setEditingId(account._id);
    setForm({ post: account.paymentRates?.post || "", reel: account.paymentRates?.reel || "" });
    setError("");
    setMessage("");
  };

  const save = async (account) => {
    setSaving(true);
    setError("");
    try {
      const response = await adminApi.patch(`/admin/social-media/accounts/${partnerId}/${account._id}/rates`, {
        post: form.post,
        reel: form.reel,
        currency: account.paymentRates?.currency || "INR"
      });
      setMessage(response.data.message);
      setEditingId(null);
      onSaved();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Couldn't save these rates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Social accounts & rates</h2>
        <p className="text-xs text-slate-500 mt-1">Each approved post or reel is paid at the rate of the account it was published on.</p>
      </div>

      {error && <p role="alert" className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {message && <p role="status" className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}

      {accounts.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No social accounts added yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <div key={account._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">
                  {PLATFORM_LABEL[account.platform] || account.platform} · {account.username || account.accountId}
                </p>
                <p className="text-sm text-slate-500">{Number(account.followers || 0).toLocaleString("en-IN")} followers/subscribers</p>
              </div>
              <Badge status={account.reviewStatus || "pending"} />

              {editingId === account._id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-slate-500">Post ₹
                    <input type="number" min="0" step="0.01" placeholder="Not paid" value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })} className="ml-1 w-28 px-2 py-1.5 border border-slate-200 rounded-lg" />
                  </label>
                  <label className="text-xs text-slate-500">Reel ₹
                    <input type="number" min="0" step="0.01" placeholder="Not paid" value={form.reel} onChange={(e) => setForm({ ...form, reel: e.target.value })} className="ml-1 w-28 px-2 py-1.5 border border-slate-200 rounded-lg" />
                  </label>
                  <Button type="button" loading={saving} onClick={() => save(account)}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-700 text-right">
                    <p>Post: <span className="font-semibold">{money(account.paymentRates?.post)}</span></p>
                    <p>Reel: <span className="font-semibold">{money(account.paymentRates?.reel)}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(account)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
