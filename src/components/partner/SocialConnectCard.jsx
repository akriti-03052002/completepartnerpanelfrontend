import { CheckCircle2, RefreshCw, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import Badge from "../ui/Badge";

// Brand marks drawn inline — lucide no longer ships brand icons.
export function InstagramLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function FacebookLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export function YouTubeLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

const BRANDS = {
  instagram: {
    name: "Instagram",
    Logo: InstagramLogo,
    tile: "bg-[linear-gradient(45deg,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)]",
    button: "bg-[linear-gradient(45deg,#fa7e1e_0%,#d62976_50%,#962fbf_100%)] hover:brightness-110",
    ring: "ring-[#d62976]/30",
    avatar: "bg-[linear-gradient(45deg,#fa7e1e,#d62976,#962fbf)]",
    blurb: "Creator or Business account",
    reads: "your username and follower count"
  },
  facebook: {
    name: "Facebook",
    Logo: FacebookLogo,
    tile: "bg-[#1877F2]",
    button: "bg-[#1877F2] hover:bg-[#166FE5]",
    ring: "ring-[#1877F2]/30",
    avatar: "bg-[#1877F2]",
    blurb: "Facebook Page you manage",
    reads: "your Page name and follower count"
  },
  youtube: {
    name: "YouTube",
    Logo: YouTubeLogo,
    tile: "bg-[#FF0000]",
    button: "bg-[#FF0000] hover:bg-[#E60000]",
    ring: "ring-[#FF0000]/25",
    avatar: "bg-[#FF0000]",
    blurb: "Your YouTube channel",
    reads: "your channel name and subscriber count",
    audience: "subscribers"
  }
};

const formatCount = (n) => Number(n || 0).toLocaleString("en-IN");

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// What SPOTX pays per approved post/reel from this account.
export function EarningsLine({ rates, className = "" }) {
  const post = rates?.post || 0;
  const reel = rates?.reel || 0;
  if (!post && !reel) {
    return <p className={`text-xs text-slate-400 ${className}`}>Earnings not set yet — SPOTX will set your rate for this account.</p>;
  }
  return (
    <p className={`text-sm text-emerald-800 ${className}`}>
      You earn{" "}
      {post ? <span className="font-semibold">{rupees(post)}</span> : <span className="text-slate-400">—</span>} per post
      <span className="text-emerald-300"> · </span>
      {reel ? <span className="font-semibold">{rupees(reel)}</span> : <span className="text-slate-400">—</span>} per reel
    </p>
  );
}

const timeAgo = (date) => {
  if (!date) return "never";
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * One platform's connect card. States: not connected → "Continue with …";
 * connected → profile, follower count, sync time, refresh; connection lost →
 * warning + "Reconnect".
 */
export default function SocialConnectCard({ platform, account, needsReconnect, connecting, refreshing, onConnect, onRefresh }) {
  const brand = BRANDS[platform];
  const { Logo } = brand;
  const handle = account ? account.username || account.accountId : "";

  return (
    <div className={`rounded-2xl border bg-white p-5 flex flex-col transition ${account ? `border-transparent ring-2 ${brand.ring}` : "border-slate-200 hover:shadow-sm"}`}>
      <div className="flex items-center gap-3">
        <span className={`h-11 w-11 shrink-0 rounded-xl text-white grid place-items-center ${brand.tile}`}>
          <Logo size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{brand.name}</p>
          <p className="text-xs text-slate-500">{brand.blurb}</p>
        </div>
        {account && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} /> Connected
          </span>
        )}
      </div>

      {account ? (
        <>
          <div className="mt-5 mb-5 flex items-center gap-3">
            <span className={`h-12 w-12 shrink-0 rounded-full p-[2px] ${brand.avatar}`}>
              <span className="h-full w-full rounded-full bg-white grid place-items-center text-lg font-bold text-slate-800 uppercase">
                {handle.replace(/^@/, "")[0] || "?"}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 truncate">{platform === "instagram" ? `@${handle}` : handle}</p>
              <p className="text-xs text-slate-500">Synced {timeAgo(account.lastSyncedAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 leading-none">{formatCount(account.followers)}</p>
              <p className="text-xs text-slate-500 mt-1">{brand.audience || "followers"}</p>
            </div>
          </div>

          <EarningsLine rates={account.paymentRates} className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5" />

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              Review <Badge status={account.reviewStatus} />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Syncing" : "Refresh"}
              </button>
              <button
                type="button"
                onClick={onConnect}
                disabled={connecting}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Switch account
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {needsReconnect ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Your {brand.name} connection stopped working. Reconnect to keep your {brand.audience === "subscribers" ? "subscriber" : "follower"} count updating.
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Log in once — we'll keep your {brand.audience === "subscribers" ? "subscriber" : "follower"} count up to date automatically.
            </p>
          )}

          <button
            type="button"
            onClick={onConnect}
            disabled={connecting}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-70 disabled:cursor-wait ${brand.button}`}
          >
            {connecting ? <Loader2 size={18} className="animate-spin" /> : <Logo size={18} />}
            {connecting ? `Opening ${brand.name}…` : `${needsReconnect ? "Reconnect" : "Continue"} with ${brand.name}`}
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <ShieldCheck size={13} className="shrink-0 mt-px" />
            We only read {brand.reads}. We never post or see your password.
          </p>
        </>
      )}
    </div>
  );
}
