import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import api from "../../services/api";
import Card from "../ui/Card";

// Wraps any route that presumes a fully-verified partner (referrals,
// opportunities, commissions, settlements, team, customers). Always
// re-checks against the server instead of trusting the partner snapshot
// cached at login, since verification can complete mid-session.
export default function VerifiedGate({ children }) {
  const [accountStatus, setAccountStatus] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("checking"); // checking | locked | unlocked

  useEffect(() => {
    api.get("/partner/profile")
      .then((res) => { setAccountStatus(res.data.data.partner.status); setError(false); setStatus(res.data.data.partner.status === "active" ? "unlocked" : "locked"); })
      .catch(() => { setError(true); setStatus("locked"); });
  }, [attempt]);

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
            {error ? "We could not load your verification status. Try again in a moment." : ["suspended", "inactive", "rejected"].includes(accountStatus) ? `Your account is ${accountStatus}. Open your profile to review its status and contact SPOTX for help.` : "Your account must be active before you can use this feature. Check your identity documents and bank details for missing information or pending approval."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-sm font-semibold">
            {error ? <button onClick={() => { setStatus("checking"); setAttempt((value) => value + 1); }} className="text-brand-red">Try again</button> : <>
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
