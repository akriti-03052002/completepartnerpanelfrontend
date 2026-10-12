import Explanation from "../../components/ui/Explanation";
import { Link } from "react-router-dom";
import PartnerCompletion from "../../components/partner/PartnerCompletion";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import BusinessOverview from "../../components/partner/BusinessOverview";
import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import ResellerDashboard from "./reseller/ResellerDashboard";

const trendMonth = period => new Date(`${period}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
const trendMoney = value => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const trendTick = value => Number(value) >= 100000 ? `₹${Number((value / 100000).toFixed(1))}L` : Number(value) >= 1000 ? `₹${Number((value / 1000).toFixed(1))}k` : `₹${value}`;

export default function Dashboard() {
  const { partner, hasPermission } = usePartnerAuth();
  const partnerType = partner?.partnerType?.trim().toLowerCase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useAutoRefresh(() => {
    if (partner && localStorage.getItem("partnerToken")) setRetry(value => value + 1);
  });

  // Reseller is billed on purchased licenses, not commission/subscription
  // stats — /partner/dashboard below is shaped for the commission-earning
  // partner types, so a Reseller gets its own dashboard entirely instead
  // of forcing that endpoint to serve two unrelated shapes.
  const isReseller = partnerType === "reseller";

  useEffect(() => {
    // isReseller short-circuits to <ResellerDashboard /> below before
    // `loading`/`data` are ever read, so there's nothing to fetch or
    // reset here for that case.
    if (isReseller || !(partner?.id || partner?._id) || !localStorage.getItem("partnerToken")) return;
    let active = true;
    const controller = new AbortController();
    api.get("/partner/dashboard", { signal: controller.signal }).then((res) => { if (active) { setData(res.data.data); setError(""); } })
      .catch(() => { if (active) setError("Could not load your dashboard. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [isReseller, retry, partner?.id, partner?._id]);

  if (isReseller) return <ResellerDashboard />;

  if (loading) return <p className="text-slate-400 text-sm">Loading dashboard...</p>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={() => { setLoading(true); setRetry(v => v + 1); }} className="font-semibold underline">Try again</button></div>;
  if (!data) return null;

  const { partnerRejectionReason, kycStatus, bankStatus, profileComplete, recentActivity, commissionTrend } = data;
  const partnerStatus = partner?.status || data.partnerStatus;
  const earningsTrendLabel = partnerType === "influencer"
    ? "Content Earnings Trend"
    : partnerType === "affiliate"
      ? "Referral Reward Trend"
      : "Commission Trend";

  const nextStep = !profileComplete ? { title: "Complete your profile", note: "Add your business and contact details to get started.", to: "/partner/profile", action: "Complete profile" }
    : ["not_submitted", "rejected"].includes(kycStatus) ? { title: "Complete KYC verification", note: kycStatus === "rejected" ? "Open your documents to see what needs correcting." : "Upload the required documents for verification.", to: "/partner/documents", action: "Open documents" }
    : ["not_submitted", "rejected"].includes(bankStatus) ? { title: "Complete bank verification", note: "Add or correct your bank details so you can receive payments.", to: "/partner/bank", action: "Open bank details" }
    : partnerStatus !== "active" ? { title: "Check your verification progress", note: "Review your account status, document checks and bank verification below.", to: "/partner/documents", action: "View verification" }
    : { title: "Your account is active", note: "Choose a task below to manage your business.", to: partnerType === "influencer" ? "/partner/post-reel" : partnerType === "affiliate" ? "/partner/deals" : "/partner/customers", action: partnerType === "influencer" ? "Manage posts and reels" : partnerType === "affiliate" ? "Manage leads" : "Manage customers" };
  const showActiveTask = nextStep.title === "Your account is active";
  const nextStepAllowed = (nextStep.to === "/partner/profile" ? hasPermission("profile:update") : nextStep.to === "/partner/documents" ? hasPermission("documents:view") : nextStep.to === "/partner/bank" ? hasPermission("bank:view") : nextStep.to === "/partner/deals" ? hasPermission("referrals:view") : nextStep.to === "/partner/customers" ? hasPermission("customers:view") : hasPermission("profile:view"));
  return (
    <div className="space-y-6">
      <PartnerCompletion nextStep={showActiveTask ? undefined : { ...nextStep, allowed: nextStepAllowed }} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          {showActiveTask && nextStepAllowed && <Link to={nextStep.to} className="inline-flex min-h-10 items-center rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90">{nextStep.action}</Link>}
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">Partner Status</span>
            <Badge status={partnerStatus} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">KYC Verification</span>
            <Badge status={kycStatus} verification />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">Bank Status</span>
            <Badge status={bankStatus} verification />
          </div>
        </div>
      </div>

      <BusinessOverview type={partnerType} summary={data.businessOverview} socialAccounts={data.typeStats?.socialAccounts} />

      {partnerStatus === "rejected" && partnerRejectionReason && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{partnerRejectionReason}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasPermission("commissions:view") && <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-red" />
            <h2 className="font-semibold text-slate-900">{earningsTrendLabel}</h2>
          </div>


          <div className="flex flex-wrap justify-between gap-2 text-sm mb-4"><p className="text-slate-500">Recorded in this period: <strong className="text-slate-900">{trendMoney(commissionTrend.reduce((sum, row) => sum + Number(row.total || 0), 0))}</strong></p><p className="text-xs text-slate-400">Current month is still in progress</p></div>
          {!commissionTrend.some(row => Number(row.total) !== 0) ? (
            <p className="text-sm text-slate-400 py-12 text-center">No commission history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={commissionTrend} margin={{ top: 12, right: 12, bottom: 12, left: 6 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tickFormatter={trendMonth} tick={{ fontSize: 11 }} minTickGap={20} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={trendTick} tick={{ fontSize: 11 }} width={65} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                <Tooltip labelFormatter={trendMonth} formatter={value => [trendMoney(value), "Total earnings"]} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
                <Line type="linear" name="Total earnings" dataKey="total" stroke="#EC2027" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <Explanation title="How to read this graph" className="mt-3"><p className="text-xs text-slate-500 ">Monthly recorded earnings in rupees · Last 12 months. Includes pending approval; excludes cancelled earnings.</p><p>Grouped by when earnings were recorded, not when they were paid. Months without earnings show zero.</p></Explanation>
        </Card>}

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <Explanation title="What is recent activity?" className="mb-3"><p>History of actions and changes in your partner account.</p></Explanation>
          <div className="space-y-4">
            {recentActivity.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
            {recentActivity.map((a) => (
              <div key={a._id} className="text-sm">
                <p className="text-slate-700">{a.description}</p>
                <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
