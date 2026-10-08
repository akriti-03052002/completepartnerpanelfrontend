import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { loadBankChecks } from "../../services/loadBankChecks";
import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import IncompleteChecks from "../../components/admin/IncompleteChecks";
import { useSearchParams } from "react-router-dom";

export default function AdminBank() {
  const [searchParams] = useSearchParams();
  const partnerType = searchParams.get("partnerType") || "";
  const [accounts, setAccounts] = useState([]);
  const [incompletePartners, setIncompletePartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [error, setError] = useState("");
  const [reviewChangeId, setReviewChangeId] = useState(null);

  const load = async () => {

    try {
      const result = await loadBankChecks();
      setAccounts(result.accounts);
      setIncompletePartners(result.incompletePartners);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load all bank checks. Please try again.");
    } finally { setLoading(false); }
  };

  useAutoRefresh(() => { if (!document.querySelector('input:focus, textarea:focus, select:focus, dialog[open]')) return load(); });
  useEffect(() => { load(); }, []);

  // A Reseller's staged replacement for an already-verified account — the
  // live account is untouched until this is approved.
  const decideChange = async (account, decision) => {
    setError("");
    let payload = {};
    if (decision === "reject") {
      const rejectionReason = window.prompt("Reason for rejecting this bank account change (shown to the partner):");
      if (rejectionReason === null) return;
      payload = { rejectionReason };
    } else {
      const check = account.pendingChange?.razorpayCheck;
      const razorpayPassed = check?.paymentStatus === "captured" && check?.nameMatchStatus === "matched";
      if (razorpayPassed) {
        if (!window.confirm("Approve this change? The proposed account will replace the partner's current verified account.")) return;
      } else {
        const overrideReason = window.prompt(
          "The Razorpay bank check hasn't passed for the proposed account (payment not captured, or the bank doesn't match). Enter a reason to approve anyway:"
        );
        if (!overrideReason?.trim()) return;
        payload = { overrideReason };
      }
    }

    try {
      await adminApi.patch(`/admin/bank/${account._id}/change/${decision}`, payload);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this bank account change.");
    }
  };

  const reveal = async (id, target) => {
    setError("");
    try {
      const res = await adminApi.get(`/admin/bank/${id}/reveal`, { params: target ? { target } : undefined });
      setRevealed((prev) => ({ ...prev, [target ? `${id}:${target}` : id]: res.data.data }));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reveal this bank account.");
    }
  };


  const changeRequests = accounts.filter((a) => a.pendingChange);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bank checks incomplete</h1>
      <p className="text-sm text-slate-500 -mt-4">Revealing full account details is restricted to finance admins and is audit-logged on every access.</p>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {loading && <p className="text-sm text-slate-400">Loading bank checks...</p>}
      {!loading && !error && <IncompleteChecks partners={incompletePartners.filter(p => !partnerType || p.partnerType === partnerType)} kind="bank" renderAction={p => p.checkStatus === "Bank update awaiting review" && <button onClick={() => setReviewChangeId(p.bankAccountId)} className="text-xs font-semibold text-brand-red hover:underline">Review bank update</button>} />}

      {!loading && changeRequests.some(a => a._id === reviewChangeId) && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-slate-900">Review bank update</h2>
            <button onClick={() => setReviewChangeId(null)} className="text-xs underline">Close review</button>
            <p className="text-sm text-slate-500">The existing verified bank account stays live until this update is approved.</p>
          </div>
          <Card>
            <Table
              empty="No bank account changes waiting for review."
              rows={changeRequests.filter(a => a._id === reviewChangeId)}
              columns={[
                { key: "partner", header: "Partner", render: (a) => a.partnerId?.legalEntity?.businessName || "—" },
                { key: "current", header: "Current Account", render: (a) => `${a.bankName} · •••• ${a.accountNumberLast4}` },
                { key: "holder", header: "Proposed Holder", render: (a) => a.pendingChange.accountHolderName },
                { key: "bank", header: "Proposed Bank", render: (a) => a.pendingChange.bankName },
                {
                  key: "acct",
                  header: "Proposed Account",
                  render: (a) => {
                    const shown = revealed[`${a._id}:pending`];
                    return shown ? `${shown.accountNumber} / ${shown.ifsc}` : `•••• ${a.pendingChange.accountNumberLast4}`;
                  }
                },
                {
                  key: "razorpay",
                  header: "Razorpay Check",
                  filter: (a) => a.razorpayCheck?.paymentStatus || "not_initiated",
                  render: (a) => {
                    const check = a.pendingChange.razorpayCheck;
                    return (
                      <div className="flex flex-col gap-1 items-start">
                        <Badge status={check?.paymentStatus || "not_initiated"}>
                          {(check?.paymentStatus || "not_initiated").replace(/_/g, " ")}
                        </Badge>
                        <Badge status={check?.nameMatchStatus === "matched" ? "verified" : check?.nameMatchStatus === "mismatched" ? "rejected" : "not_submitted"}>
                          {(check?.nameMatchStatus || "not_checked").replace(/_/g, " ")}
                        </Badge>
                      </div>
                    );
                  }
                },
                { key: "submitted", header: "Requested", render: (a) => (a.pendingChange.submittedAt ? new Date(a.pendingChange.submittedAt).toLocaleDateString() : "—") },
                {
                  key: "actions",
                  header: "",
                  render: (a) => (
                    <div className="flex gap-3">
                      {!revealed[`${a._id}:pending`] && (
                        <button onClick={() => reveal(a._id, "pending")} className="text-xs font-semibold text-slate-500 hover:underline">Reveal</button>
                      )}
                      <button onClick={() => decideChange(a, "approve")} className="text-xs font-semibold text-emerald-600 hover:underline">Approve</button>
                      <button onClick={() => decideChange(a, "reject")} className="text-xs font-semibold text-brand-red hover:underline">Reject</button>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
