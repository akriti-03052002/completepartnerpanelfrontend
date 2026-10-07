import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import adminApi from "../../services/adminApi";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

// Reveals full account number/IFSC (finance-role only, audit-logged server
// side) so an admin can actually check the entered details before deciding
// — mirrors DocumentPreviewModal's "preview, then decide" flow.
export default function BankAccountPreviewModal({ account, onClose, onVerify, onReject }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const panelRef = useDialogFocus(onClose, busy);

  useEffect(() => {
    let cancelled = false;

    adminApi.get(`/admin/bank/${account.id || account._id}/reveal`)
      .then((res) => { if (!cancelled) { setDetails(res.data.data); setError(""); } })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || "Couldn't load bank details.");
      });

    return () => { cancelled = true; };
  }, [account, retry]);

  const razorpayCheck = account.razorpayCheck;
  const razorpayPassed = razorpayCheck?.paymentStatus === "captured" && razorpayCheck?.nameMatchStatus === "matched";

  const handleVerify = async () => {
    let overrideReason;
    if (!razorpayPassed) {
      overrideReason = window.prompt(
        "The Razorpay bank check hasn't passed (payment not captured, or the name doesn't match). Enter a reason to verify anyway:"
      );
      if (!overrideReason?.trim()) return;
    }
    setBusy(true);
    try {
      await onVerify(account._id || account.id, overrideReason);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this decision. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Reason for rejecting this bank account?");
    if (reason === null) return;
    if (!reason.trim()) { setError("Enter a reason so the partner knows what to correct."); return; }
    setBusy(true);
    try {
      await onReject(account._id || account.id, reason);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this decision. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!busy) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Bank account details" className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-900">Bank Account Details</p>
          <button type="button" disabled={busy} onClick={onClose} className="text-slate-400 hover:text-brand-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5">
          {error && <div role="alert" className="text-sm text-red-600"><p>{error}</p>{!details && <Button variant="outline" onClick={() => { setError(""); setRetry(value => value + 1); }}>Try again</Button>}</div>}
          {!error && !details && <p className="text-sm text-slate-400">Loading...</p>}
          {details && (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-400">Account Holder</dt>
                <dd className="text-sm font-medium text-slate-900">{details.accountHolderName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Bank Name</dt>
                <dd className="text-sm font-medium text-slate-900">{details.bankName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Account Number</dt>
                <dd className="text-sm font-mono font-medium text-slate-900">{details.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">IFSC</dt>
                <dd className="text-sm font-mono font-medium text-slate-900">{details.ifsc}</dd>
              </div>
            </dl>
          )}

          {razorpayCheck && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Automated Razorpay check</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge status={razorpayCheck.paymentStatus || "not_initiated"}>
                  Payment: {(razorpayCheck.paymentStatus || "not_initiated").replace(/_/g, " ")}
                </Badge>
                <Badge status={razorpayCheck.nameMatchStatus === "matched" ? "verified" : razorpayCheck.nameMatchStatus === "mismatched" ? "rejected" : "not_submitted"}>
                  Bank match: {(razorpayCheck.nameMatchStatus || "not_checked").replace(/_/g, " ")}
                </Badge>
              </div>
              {razorpayCheck.method && (
                <p className="text-xs text-slate-500">
                  Paid via <span className="font-medium text-slate-700">{razorpayCheck.method}</span>
                  {razorpayCheck.matchedBankName && <> — Razorpay recorded <span className="font-medium text-slate-700">{razorpayCheck.matchedBankName}</span></>}
                </p>
              )}
              {razorpayCheck.failureReason && (
                <p className="text-xs text-slate-500 mt-1">{razorpayCheck.failureReason}</p>
              )}
              {!razorpayPassed && (
                <p className="text-xs text-amber-700 mt-1.5">Verifying without a passed check requires an override reason.</p>
              )}
            </div>
          )}
        </div>

        {account.verification?.status === "pending" && (onVerify || onReject) && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
            {onReject && <Button variant="danger" onClick={handleReject} loading={busy}>Reject bank details</Button>}
            {onVerify && <Button onClick={handleVerify} disabled={!details} loading={busy}>Approve bank details</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
