import { useState } from "react";
import Button from "./Button";
import { Input, Select } from "./Input";

export default function OfflinePaymentModal({ open, title, error, onConfirm, onCancel, amount, partnerName, invoiceNumber, trackCheque = false }) {
  const [method, setMethod] = useState("razorpay");
  const [transactionId, setTransactionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [chequeStatus, setChequeStatus] = useState("received");
  if (!open) return null;
  const close = () => {
    if (busy) return;
    setMethod("razorpay");
    setTransactionId("");
    setConfirmed(false);
    onCancel();
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!confirmed || busy || !transactionId.trim()) return;
    setBusy(true);
    try { await onConfirm({ method, transactionId: transactionId.trim(), ...(trackCheque && method === "cheque" ? { chequeStatus } : {}) }); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
          <p className="font-medium text-slate-900">{partnerName || "Reseller"}</p>
          {invoiceNumber && <p>{invoiceNumber}</p>}
          <p className="font-semibold">₹{Number(amount || 0).toLocaleString("en-IN")}</p>
          <p>Method: {method === "razorpay" ? "Razorpay" : method === "cheque" ? "Cheque" : "Cash"}</p>
        </div>
        <Select label="Payment method" value={method} onChange={(e) => { setMethod(e.target.value); setTransactionId(""); setConfirmed(false); }} disabled={busy}>
          <option value="razorpay">Razorpay</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
        </Select>
        {trackCheque && method === "cheque" && <Select label="Cheque status" value={chequeStatus} onChange={(e) => { setChequeStatus(e.target.value); setConfirmed(false); }} disabled={busy}><option value="received">Received - awaiting clearance</option><option value="cleared">Cleared - full payment received</option><option value="bounced">Bounced - invoice remains unpaid</option></Select>}
        <p className="text-sm text-slate-500">{method === "razorpay" ? "The payment is checked against Razorpay for captured status and the exact amount." : method === "cheque" ? trackCheque && chequeStatus !== "cleared" ? "This records the cheque status. The invoice stays unpaid." : "Confirm only after the cheque has cleared and the full amount was received." : "Confirm only after receiving the full amount in cash."}</p>
        <Input label={method === "razorpay" ? "Razorpay payment ID" : method === "cheque" ? "Cheque number" : "Cash receipt number"} value={transactionId} onChange={(e) => { setTransactionId(e.target.value); setConfirmed(false); }} required disabled={busy} />
        <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy} className="mt-1" />I checked the partner, amount, method and reference{method === "cheque" ? trackCheque && chequeStatus !== "cleared" ? ", and checked the cheque status" : ", and the cheque has cleared" : method === "cash" ? ", and received the full amount" : ""}.</label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!transactionId.trim() || !confirmed || busy}>{trackCheque && method === "cheque" && chequeStatus !== "cleared" ? "Record Cheque Status" : "Confirm Payment"}</Button>
        </div>
      </form>
    </div>
  );
}
