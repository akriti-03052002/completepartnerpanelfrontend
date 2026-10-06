import PaymentHistory from "../../../components/ui/PaymentHistory";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import Card from "../../../components/ui/Card";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import { getVisibleLicenceBills } from "../../../utils/licenceBills";
import Button from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Input";
import { waitForRazorpay } from "../../../utils/razorpayCheckout";

export default function ResellerBilling() {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ["reseller", "invoices"],
    queryFn: () => api.get("/partner/reseller/invoices").then((res) => res.data.data)
  });
  // One bill per licence purchase, each with its own cycle and instalments.
  const { data: schedule = null, isLoading: estimateLoading, error: scheduleError } = useQuery({
    queryKey: ["reseller", "invoices", "current-due"],
    queryFn: () => api.get("/partner/reseller/invoices/current-due").then((res) => res.data.data)
  });

  const loading = invoicesLoading || estimateLoading;

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ["reseller", "invoices"] });
  };

  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [historyInvoice, setHistoryInvoice] = useState(null);
  const [billView, setBillView] = useState("current");
  const [breakdownFor, setBreakdownFor] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // List rows don't carry the line items, so fetch the single-invoice
  // endpoint (which adds the purchase it bills) before opening the modal.
  const openInvoiceBreakdown = async (invoiceId) => {
    setBreakdownLoading(true);
    try {
      const res = await api.get(`/partner/reseller/invoices/${invoiceId}`);
      setBreakdownFor(res.data.data);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Razorpay's own payment-lookup can lag a signature that already proved
  // success by a few minutes (see verifyInvoicePayment) — poll in the
  // background instead of leaving the partner stuck on a scary error, and
  // stop as soon as this invoice shows paid or the window runs out.
  const polling = useRef(null);
  useEffect(() => () => {
    if (polling.current) {
      polling.current.cancelled = true;
      clearTimeout(polling.current.timer);
    }
  }, []);

  const pollUntilPaid = (invoiceId) => {
    if (polling.current) {
      polling.current.cancelled = true;
      clearTimeout(polling.current.timer);
    }
    const state = { cancelled: false, timer: null, startedAt: Date.now() };
    polling.current = state;
    const poll = async () => {
      if (state.cancelled || Date.now() - state.startedAt > 10 * 60 * 1000) return;
      try {
        const res = await api.get("/partner/reseller/invoices");
        if (state.cancelled) return;
        queryClient.setQueryData(["reseller", "invoices"], res.data.data);
        if (res.data.data.some((invoice) => invoice._id === invoiceId && invoice.paymentStatus === "paid")) {
          setInfo("");
          load();
          return;
        }
      } catch {
        if (state.cancelled) return;
        setInfo("Payment confirmation is delayed. We will keep checking; you can also refresh this page.");
      }
      if (!state.cancelled) state.timer = setTimeout(poll, 20000);
    };
    state.timer = setTimeout(poll, 20000);
  };

  const [requestingOnline, setRequestingOnline] = useState(false);

  const requestOnline = async (invoice) => {
    setError("");
    setRequestingOnline(true);
    try {
      await api.post(`/partner/reseller/invoices/${invoice._id}/request-online`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong sending this request.");
    } finally {
      setRequestingOnline(false);
    }
  };

  const handlePay = async (invoice) => {
    setError("");
    setPayingId(invoice._id);

    try {
      const res = await api.post(`/partner/reseller/invoices/${invoice._id}/pay`, {});
      const { razorpayOrderId, amount, currency, keyId } = res.data.data;

      const Razorpay = await waitForRazorpay();

      const rzp = new Razorpay({
        key: keyId,
        amount,
        currency,
        name: "SPOTX",
        description: `Invoice ${invoice.invoiceNumber}`,
        order_id: razorpayOrderId,
        theme: { color: "#E11D2E" },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              other: {
                name: "Other payment modes",
                instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }]
              }
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: false }
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
        handler: async (response) => {
          try {
            const verifyRes = await api.post(`/partner/reseller/invoices/${invoice._id}/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            if (verifyRes.data.pending) {
              setInfo(verifyRes.data.message);
              pollUntilPaid(invoice._id);
            } else {
              setInfo("");
            }
            load();
          } catch (err) {
            setError(err.response?.data?.message || "We couldn't confirm your payment. If any amount was debited, contact support with your payment ID.");
          } finally {
            setPayingId(null);
          }
        }
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. You can try again.");
        setPayingId(null);
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong starting the payment.");
      setPayingId(null);
    }
  };

  const billRows = getVisibleLicenceBills(invoices, schedule?.bills || []);
  const visibleBills = billRows.filter((bill) => billView === "all" ||
    (billView === "paid" ? bill.status === "paid" :
      billView === "upcoming" ? bill.status === "upcoming" :
        bill.status !== "paid" && bill.status !== "upcoming"));
  const outstanding = invoices.filter((invoice) => invoice.paymentStatus !== "paid");
  const overdue = outstanding.filter((invoice) => new Date(invoice.dueDate).getTime() < currentTime);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Payments</h1>
        <p className="text-sm text-slate-500 mt-1">These are license invoices you pay to SPOTX, not commissions paid to you.</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {info && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">{info}</div>}
      {!loading && !invoicesError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-1"><p>Outstanding: <strong>{rupees(outstanding.reduce((sum, invoice) => sum + invoice.total, 0))}</strong> across {outstanding.length} invoices.</p><p>Overdue: <strong>{rupees(overdue.reduce((sum, invoice) => sum + invoice.total, 0))}</strong> across {overdue.length} invoices. {overdue.length > 0 && "Open a pending invoice below to pay online or contact SPOTX about offline payment."}</p></div>}

      <Card>
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Your licence bills</h2>
          <p className="text-sm text-slate-500 mt-1">All purchases in one table. Upcoming bills appear seven days before their bill date.</p>
          <p className="text-xs text-slate-500 mt-2">Pending: an unpaid invoice. Overdue: its due date has passed. Upcoming: a bill expected within seven days; payment becomes available when its invoice is raised and online payment is enabled.</p>
          <Select label="Show bills" value={billView} onChange={(event) => setBillView(event.target.value)} className="mt-4 sm:w-64">
            <option value="current">Pending</option>
            <option value="upcoming">Upcoming</option>
            <option value="paid">Previous paid bills</option>
            <option value="all">All bills</option>
          </Select>
        </div>
        {invoicesError || scheduleError ? <div className="p-6 text-sm text-red-700">Could not load bills. <Button variant="outline" onClick={load}>Retry</Button></div> : loading ? <p className="text-slate-400 text-sm p-6">Loading...</p> : (
          <Table
            mobileColumns={["order", "invoice", "status", "total", "due", "paid", "method", "actions"]}
            searchPlaceholder="Search by order, invoice or status"
            key={billView}
            empty={billView === "paid" ? "No paid bills yet." : billView === "upcoming" ? "No upcoming bills within the next seven days." : billView === "current" ? "No pending bills." : "No bills to show yet."}
            rows={visibleBills}
            columns={[
              { key: "order", header: "Purchase", render: (i) => i.orderCode || "\u2014", filter: (i) => i.orderCode },
              { key: "licenses", header: "Licences", render: (i) => i.quantity },
              { key: "bill", header: "Bill", render: (i) => i.number ? `${i.number} of ${i.installmentsInTerm}` : "\u2014" },
              { key: "date", header: "Bill date", render: (i) => shortDate(i.billDate) },
              { key: "period", header: "Covers", render: (i) => `${shortDate(i.periodStart)} to ${shortDate(i.periodEnd)}` },
              { key: "amount", header: "Amount", render: (i) => rupees(i.subtotal) },
              { key: "gst", header: "GST", render: (i) => `${rupees(i.taxAmount)} (${i.taxRatePercent}%)` },
              { key: "total", header: "To pay", render: (i) => <span className="font-semibold">{rupees(i.total)}</span> },
              { key: "invoice", header: "Invoice", render: (i) => i.invoiceNumber || "\u2014" },
              { key: "status", header: "Status", filter: (i) => i.status, render: (i) => i.status === "upcoming" ? <Badge tone="neutral">Upcoming</Badge> : <Badge status={i.status} /> },
              { key: "cheque", header: "Cheque", render: (i) => i.invoice?.cheque?.status || "—" },
              { key: "due", header: "Due", render: (i) => shortDate(i.dueDate) },
              { key: "paid", header: "Paid on", render: (i) => i.invoice?.paidAt ? shortDate(i.invoice.paidAt) : "—" },
              { key: "method", header: "Payment method", render: (i) => i.status === "paid" ? <span className="capitalize">{i.invoice?.offlinePayment?.method || i.invoice?.razorpay?.method || (i.invoice?.razorpay?.paymentId ? "Razorpay" : i.invoice?.paymentMode) || "—"}</span> : "—" },
              { key: "reference", header: "Payment reference", render: (i) => i.invoice?.offlinePayment?.transactionId || i.invoice?.razorpay?.paymentId || "\u2014" },
              {
                key: "actions", header: "Actions", render: (i) => i.invoice ? (
                  <div className="flex flex-col items-start gap-2">
                    <button type="button" onClick={() => setHistoryInvoice(i.invoice)} className="text-xs font-semibold text-brand-red hover:underline">Payment history</button>
                    <button type="button" disabled={breakdownLoading} onClick={() => openInvoiceBreakdown(i.invoice._id)} className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-50">View details</button>
                    {i.status !== "paid" && (i.invoice.canPayNow ? (
                      <Button loading={payingId === i.invoice._id} onClick={() => handlePay(i.invoice)}>Pay Now</Button>
                    ) : i.invoice.paymentMode === "online" ? (
                      <span className="text-xs text-slate-400">Online payment available later</span>
                    ) : i.invoice.onlineRequested ? (
                      <span className="text-xs text-amber-600">Online payment requested</span>
                    ) : (
                      <button type="button" disabled={requestingOnline} onClick={() => requestOnline(i.invoice)} className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-50">Request online payment</button>
                    ))}
                  </div>
                ) : "\u2014"
              }
            ]}
          />
        )}
      </Card>

      {historyInvoice && <PaymentHistory invoice={historyInvoice} onClose={() => setHistoryInvoice(null)} />}
      {breakdownFor && <BillingBreakdownModal data={breakdownFor} onClose={() => setBreakdownFor(null)} />}
    </div>
  );
}

// The full breakdown of one invoice — an unpaid one or any row in Invoice
// History — down to the purchase it bills (see resellerBilling.js's
// getInvoiceLineItems).
const CYCLE_LABEL = { 1: "monthly", 3: "quarterly", 12: "yearly" };

function BillingBreakdownModal({ data, onClose }) {
  const baseAmount = data.baseAmount ?? data.purchasedLicenseSnapshot * data.unitPriceSnapshot * data.cycleMultiplier;
  const cycleLabel = CYCLE_LABEL[data.cycleMultiplier] || data.billingCycle;

  const pricingLine = (() => {
    if (data.pricingModeSnapshot === "fixed_price" && data.fixedUnitPriceSnapshot != null) {
      return `Fixed price of ₹${data.fixedUnitPriceSnapshot}/screen`;
    }
    if (data.pricingModeSnapshot === "discount_percent" && data.wholesaleDiscountPercentSnapshot != null) {
      return `${data.wholesaleDiscountPercentSnapshot}% discount off ₹${data.standardUnitPriceSnapshot}/screen standard rate`;
    }
    return null;
  })();

  const baseLineItems = data.baseLineItems || [];
  const proratedLineItems = data.proratedLineItems || [];

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-slate-900">{data.invoiceNumber}{data.installmentNumber ? ` · bill ${data.installmentNumber} of ${data.installmentsInTerm}` : ""}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <p className="text-xs text-slate-400 mb-1">
          {new Date(data.billingPeriodStart).toLocaleDateString()} – {new Date(data.billingPeriodEnd).toLocaleDateString()}
        </p>
        <p className="text-xs mb-4">
          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase tracking-wide">
            {cycleLabel} billing
          </span>
        </p>

        {/* Base licenses — purchased before this cycle. Each batch is billed
            at the rate it locked in when IT was bought, not today's rate —
            a later price change only applies to licenses bought after that
            change, so different batches here can show different rates. */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Licences on this bill ({data.purchasedLicenseSnapshot})
          </p>
          {baseLineItems.length > 0 && (
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 mb-2">
              {baseLineItems.map((item) => (
                <div key={item.orderCode} className="flex items-center justify-between px-3 py-1.5 text-xs gap-3">
                  <span className="text-slate-500">
                    {item.orderCode} · {item.quantity} licenses · {item.purchaseDate ? `purchased ${new Date(item.purchaseDate).toLocaleDateString()}` : "no linked order"}
                    <br />
                    ₹{item.unitPrice}/screen/month × {item.quantity} × {item.cycleMultiplier} month{item.cycleMultiplier === 1 ? "" : "s"}
                  </span>
                  <span className="text-slate-900 font-medium whitespace-nowrap">₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-500">Subtotal</span>
            <span className="text-slate-900">₹{baseAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Mid-cycle additions — billed immediately at the full cycle rate, same as base licenses, never a days-remaining fraction */}
        {proratedLineItems.length > 0 && (
          <div className="mb-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Added mid-cycle ({data.proratedLicenseCount} licenses, billed at the full {cycleLabel} rate — no day proration)
            </p>
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 mb-2">
              {proratedLineItems.map((item) => (
                <div key={item.orderCode} className="flex items-center justify-between px-3 py-1.5 text-xs gap-3">
                  <span className="text-slate-500">
                    {item.orderCode} · {item.quantity} licenses · added {new Date(item.purchaseDate).toLocaleDateString()}
                    <br />
                    ₹{item.unitPrice}/screen/month × {item.quantity} × {item.cycleMultiplier} month{item.cycleMultiplier === 1 ? "" : "s"}
                  </span>
                  <span className="text-slate-900 font-medium whitespace-nowrap">₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">₹{data.proratedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm pt-3 border-t border-slate-200">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-700">Subtotal</span>
            <span className="text-slate-900">₹{data.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          {/* GST split into CGST + SGST (each half the total rate) — the
              standard Indian intra-state GST invoice format. */}
          <div className="flex justify-between">
            <span className="text-slate-500">CGST ({(data.taxRatePercent / 2).toFixed(1)}%)</span>
            <span className="text-slate-900 font-medium">₹{(data.taxAmount / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">SGST ({(data.taxRatePercent / 2).toFixed(1)}%)</span>
            <span className="text-slate-900 font-medium">₹{(data.taxAmount / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total GST ({data.taxRatePercent}%)</span>
            <span>₹{data.taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold">
            <span className="text-slate-900">Total</span>
            <span className="text-slate-900">₹{data.total.toLocaleString("en-IN")}</span>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <span className="text-slate-500">Due date</span>
            <span className="text-slate-900 font-medium">{new Date(data.dueDate).toLocaleDateString()}</span>
          </div>
          {data.paymentStatus && (
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <Badge status={data.paymentStatus} />
            </div>
          )}
          {data.razorpay?.paymentId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID</span>
              <span className="text-slate-900 font-medium">{data.razorpay.paymentId}</span>
            </div>
          )}
        </div>

        {pricingLine && <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">{pricingLine}</p>}
      </div>
    </div>
  );
}

const rupees = (amount) => `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const shortDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

