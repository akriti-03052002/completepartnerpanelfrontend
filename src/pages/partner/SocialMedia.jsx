import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useEffect, useState } from "react";
import { Share2, CheckCircle2, AlertCircle, X, ChevronDown, PenLine } from "lucide-react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";
import SocialConnectCard, { InstagramLogo, FacebookLogo, YouTubeLogo, EarningsLine } from "../../components/partner/SocialConnectCard";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

const PLATFORMS = ["instagram", "youtube", "facebook"];
const CONNECTABLE = ["instagram", "facebook", "youtube"];
const PLATFORM_ICON = { instagram: InstagramLogo, facebook: FacebookLogo, youtube: YouTubeLogo };

const capitalize = (value) => (value ? value[0].toUpperCase() + value.slice(1) : "");

// Meta sends the user back here with the connect outcome in the query string.
const readOauthResult = () => {
  const params = new URLSearchParams(window.location.search);
  return { social: params.get("social"), platform: params.get("platform") || "", message: params.get("message") };
};

export default function SocialMedia() {
  const [oauthResult] = useState(readOauthResult);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ platform: "instagram", accountId: "", followers: "" });
  const [loading, setLoading] = useState(true);
  const accountList = useListFilter(accounts, [
    { label: "Platform", value: (a) => a.platform },
    { label: "Status", value: (a) => a.reviewStatus }
  ]);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState(() => (oauthResult.social === "error" ? oauthResult.message || "Couldn't connect this account." : ""));
  const [message, setMessage] = useState(() => (
    oauthResult.social === "connected"
      ? `${capitalize(oauthResult.platform)} connected! Your follower count will now update automatically.`
      : ""
  ));

  const connect = async (platform) => {
    setConnecting(platform);
    setError("");
    try {
      const response = await api.get(`/partner/social/${platform}/start`, { params: { returnTo: window.location.origin } });
      window.location.assign(response.data.url);
    } catch (connectError) {
      setError(connectError.response?.data?.message || "Social login is not configured.");
      setConnecting(null);
    }
  };

  const loadAccounts = async () => {
    const response = await api.get("/partner/social/accounts");
    setAccounts(response.data.data);
  };

  // An account linked through login (not typed in by hand) for this platform.
  const connectedAccount = (platform) => accounts.find((account) => account.platform === platform && account.connected);
  const needsReconnect = (platform) => accounts.some((account) => account.platform === platform && account.source === "oauth" && !account.connected);

  const refresh = async (accountId) => {
    setRefreshingId(accountId);
    setError("");
    setMessage("");
    try {
      await api.post(`/partner/social/accounts/${accountId}/refresh`);
      await loadAccounts();
      setMessage("Follower count updated.");
    } catch (refreshError) {
      setError(refreshError.response?.data?.message || "Couldn't refresh this account.");
      await loadAccounts().catch(() => {});
    } finally {
      setRefreshingId(null);
    }
  };

  useAutoRefresh(() => { if (!document.querySelector('input:focus, textarea:focus, select:focus, dialog[open]')) return loadAccounts(); });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("social")) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    api.get("/partner/social/accounts")
      .then((response) => setAccounts(response.data.data))
      .catch((loadError) => setError(loadError.response?.data?.message || "Couldn't load social accounts."))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post("/partner/social/accounts", { ...form, followers: Number(form.followers) });
      setForm((current) => ({ ...current, accountId: "", followers: "" }));
      setMessage("Your account was submitted for admin review.");
      await loadAccounts();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Couldn't submit this social account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Social Media Accounts</h1>
        <p className="text-sm text-slate-500 mt-1">Connect your creator accounts so SPOTX can verify your reach before you submit content.</p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss" className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}
      {message && (
        <div role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{message}</span>
          <button type="button" onClick={() => setMessage("")} aria-label="Dismiss" className="text-emerald-400 hover:text-emerald-600"><X size={16} /></button>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CONNECTABLE.map((platform) => {
          const account = connectedAccount(platform);
          return (
            <SocialConnectCard
              key={platform}
              platform={platform}
              account={loading ? null : account}
              needsReconnect={!loading && !account && needsReconnect(platform)}
              connecting={connecting === platform}
              refreshing={Boolean(account) && refreshingId === account._id}
              onConnect={() => connect(platform)}
              onRefresh={() => account && refresh(account._id)}
            />
          );
        })}
      </div>

      <Card>
        <button
          type="button"
          onClick={() => setShowManual((open) => !open)}
          className="w-full p-5 flex items-center gap-3 text-left"
          aria-expanded={showManual}
        >
          <span className="h-9 w-9 rounded-lg bg-slate-100 text-slate-500 grid place-items-center"><PenLine size={16} /></span>
          <span className="flex-1">
            <span className="block font-semibold text-slate-900">Add an account manually</span>
            <span className="block text-xs text-slate-500">Only if you can't connect above. An admin will verify it by hand.</span>
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition ${showManual ? "rotate-180" : ""}`} />
        </button>
        {showManual && (
          <form onSubmit={submit} className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Select label="Platform" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
                {PLATFORMS.map((platform) => <option key={platform} value={platform}>{capitalize(platform)}</option>)}
              </Select>
              <Input
                label="Account ID / handle"
                value={form.accountId}
                onChange={(event) => setForm({ ...form, accountId: event.target.value })}
                placeholder="@yourhandle or channel ID"
                required
                maxLength={120}
              />
              <Input
                label="Follower / subscriber count"
                type="number"
                min="0"
                step="1"
                value={form.followers}
                onChange={(event) => setForm({ ...form, followers: event.target.value })}
                placeholder="e.g. 12500"
                required
              />
            </div>
            <Button type="submit" loading={busy}>Submit for review</Button>
          </form>
        )}
      </Card>

      <Card>
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All your accounts</h2>
        </div>
        <ListToolbar toolbar={accountList.toolbar} placeholder="Search your accounts" className="p-3 border-b border-slate-100" />
        {loading ? <p className="p-6 text-sm text-slate-400">Loading accounts...</p> : accounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <Share2 size={24} className="mx-auto mb-2 text-slate-300" />
            No accounts yet — connect Instagram, Facebook or YouTube above to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {accountList.visible.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Nothing matches your search or filters.</p>}
            {accountList.visible.map((account) => {
              const Icon = PLATFORM_ICON[account.platform];
              return (
                <div key={account._id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-2 font-medium text-slate-900">
                      {Icon ? <Icon size={16} /> : <Share2 size={16} />}
                      <span className="capitalize">{account.platform}</span>
                      <span className="text-slate-400">·</span>
                      <span className="truncate">{account.username || account.accountId}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {Number(account.followers || 0).toLocaleString()} followers/subscribers
                      <span className="text-slate-300"> · </span>
                      {account.connected ? "Auto-updating" : account.source === "oauth" ? "Connection lost" : "Added manually"}
                    </p>
                    {account.reviewStatus !== "rejected" && <EarningsLine rates={account.paymentRates} className="mt-1" />}
                    {account.rejectionReason && <p className="text-xs text-red-600 mt-1">Admin note: {account.rejectionReason}</p>}
                  </div>
                  <Badge status={account.reviewStatus} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
