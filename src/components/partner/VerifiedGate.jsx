import { usePartnerProfile } from "../../hooks/usePartnerProfile";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import Card from "../ui/Card";
import { usePartnerAuth } from "../../context/PartnerAuthContext";

// Wraps any route that presumes a fully-verified partner (referrals,
// opportunities, commissions, settlements, team, customers). Always
// shares the layout's live profile check; API middleware independently
// enforces verification so navigation need not wait for another round trip.
export default function VerifiedGate({ children }) {
  const { partner } = usePartnerAuth();
  const profile = usePartnerProfile();
  const accountStatus = profile.data?.partner.status || partner?.status;
  const error = profile.isError && !profile.data;
  // Render an active account's page while refreshing; backend middleware
  // still validates current verification/permissions for every request.
  const status = profile.isPending ? "checking"
    : error || accountStatus !== "active" ? "locked" : "unlocked";

  if (status === "checking") {
    return <p className="text-slate-400 text-sm">Loading...</p>;
  }

  if (status === "locked") {
    return (
      <Card className="p-6 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Lock size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{error ? "Could not check your account" : ["suspended", "inactive", "rejected"].includes(accountStatus) ? "Your account needs attention" : "Complete verification to use this feature"}</p>
          <p className="text-sm text-slate-500 mt-1">
            {error ? "We could not load your verification status. Try again in a moment." : ["suspended", "inactive", "rejected"].includes(accountStatus) ? `Your account is ${accountStatus}. Open your profile to review its status and contact SPOTX for help.` : "Your account must be active before you can use this feature. Check your KYC documents and bank details for missing information or pending approval."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-sm font-semibold">
            {error ? <button onClick={() => profile.refetch()} className="text-brand-red">Try again</button> : <>
              <Link to="/partner/documents" className="text-brand-red">Check documents</Link>
              <Link to="/partner/bank" className="text-brand-red">Check bank details</Link>
              <Link to="/partner/profile" className="text-brand-red">View profile</Link>
            </>}
          </div>
        </div>
      </Card>
    );
  }

  return children;
}
