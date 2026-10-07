import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import InvoiceDownload from "../../components/ui/InvoiceDownload";
import PaymentHistory from "../../components/ui/PaymentHistory";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../services/adminApi";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import OfflinePaymentModal from "../../components/ui/OfflinePaymentModal";
import Table from "../../components/ui/Table";
import { InvoiceAmount } from "../../components/ui/FinancialAmount";

const DURATIONS = [
  { key: "all", days: null },
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "365d", days: 365 }
];

const money = (value) => `₹${(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdminResellerReceivables({ partnerId, status, duration, search }) {
  const fetching = useRef(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [historyInvoice, setHistoryInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [verifyingInvoiceId, setVerifyingInvoiceId] = useState(null);
  const [offlineError, setOfflineError] = useState("");
  const [switchingInvoiceId, setSwitchingInvoiceId] = useState(null);

  useAutoRefresh(() => {
    setCurrentTime(Date.now());
    if (!fetching.current) setReloadKey(key => key + 1);
  });

  useEffect(() => {
    let active = true;
    fetching.current = true;
    adminApi.get("/admin/reseller/invoices", { params: { partnerId: partnerId || undefined } })
      .then((res) => {
        if (active) {
          setInvoices(res.data.data);
          setLastUpdated(new Date());
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Couldn't load reseller invoices.");
      })
      .finally(() => {
        if (active) { setLoading(false); fetching.current = false; }
      });
    return () => { active = false; };
  }, [partnerId, reloadKey]);

  const filtered = useMemo(() => {
    const durationDef = DURATIONS.find((item) => item.key === duration);
    const cutoff = durationDef?.days ? currentTime - durationDef.days * 24 * 60 * 60 * 1000 : null;
    const query = search.trim().toLowerCase();
    const invoiceStatuses = ["pending", "overdue", "paid", "failed"];

    return invoices.filter((invoice) => {
      if (status !== "all" && (!invoiceStatuses.includes(status) || (invoice.paymentStatus !== "paid" && new Date(invoice.dueDate).getTime() < currentTime ? "overdue" : invoice.paymentStatus) !== status)) return false;
      if (cutoff && new Date(invoice.createdAt).getTime() < cutoff) return false;
      if (query && ![
        invoice.invoiceNumber,
        invoice.partnerId?.legalEntity?.businessName,
        invoice.partnerId?.partnerCode,
        invoice.offlinePayment?.transactionId,
        invoice.razorpay?.paymentId
      ].some((value) => value?.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [duration, invoices, search, status, currentTime]);

  const outstandingTotal = invoices
    .filter((invoice) => invoice.paymentStatus !== "paid")
    .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const overdueInvoices = invoices.filter((invoice) => invoice.paymentStatus !== "paid" && new Date(invoice.dueDate).getTime() < currentTime);
  const unpaidInvoices = invoices.filter(invoice => invoice.paymentStatus !== "paid");
  const dueThisWeek = unpaidInvoices.filter(invoice => {
    const due = new Date(invoice.dueDate).getTime();
    return due >= currentTime && due <= currentTime + 7 * 24 * 60 * 60 * 1000;
  });
  const dueThisWeekTotal = dueThisWeek.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const overdueTotal = overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const [checkingReminders, setCheckingReminders] = useState(false);
  const checkReminders = async () => {
    setCheckingReminders(true);
    try { await adminApi.post("/admin/reseller/check-notifications"); setMessage("Scheduled reminders checked. Eligible unpaid invoices receive reminders; duplicate reminders are skipped."); }
    catch { setError("Could not check reminders."); }
    finally { setCheckingReminders(false); }
  };
  const receivedTotal = invoices
    .filter((invoice) => invoice.paymentStatus === "paid")
    .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const unlinkedCount = filtered.filter((invoice) => !invoice.partnerId).length;

  const switchToOnline = async (invoiceId) => {
    setSwitchingInvoiceId(invoiceId);
    setMessage("");
    try {
      await adminApi.patch(`/admin/reseller/invoices/${invoiceId}/payment-mode`);
      setMessage("Invoice switched to online payment.");
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't switch this invoice to online payment.");
    } finally {
      setSwitchingInvoiceId(null);
    }
  };

  const verifyOfflinePayment = async (paymentDetails) => {
    setOfflineError("");
    try {
      await adminApi.patch(`/admin/reseller/invoices/${verifyingInvoiceId}/verify-offline`, paymentDetails);
      setVerifyingInvoiceId(null);
      setMessage(paymentDetails.method === "cheque" && paymentDetails.chequeStatus !== "cleared" ? "Cheque status recorded; invoice remains unpaid." : "Payment recorded and invoice marked paid.");
      setReloadKey((key) => key + 1);
    } catch (err) {
      setOfflineError(err.response?.data?.message || "Couldn't verify this reseller payment.");
    }
  };

  return (
    <>
      {historyInvoice && <PaymentHistory invoice={historyInvoice} onClose={() => setHistoryInvoice(null)} />}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">{loading ? "Loading overdue invoices..." : !lastUpdated ? "Overdue totals unavailable." : <><p>Pending payment: <strong>{money(outstandingTotal)}</strong> across {unpaidInvoices.length} bills.</p><p>Due in the next 7 days: <strong>{money(dueThisWeekTotal)}</strong> across {dueThisWeek.length} bills.</p><p>Overdue: {money(overdueTotal)} across {overdueInvoices.length} invoices.</p></>} <button type="button" disabled={checkingReminders} onClick={checkReminders} className="font-semibold underline disabled:opacity-50">{checkingReminders ? "Checking..." : "Check payment reminders"}</button><p className="text-xs text-slate-500 mt-1">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}. Overview includes all issued bills for the selected partner(s); table filters apply below. ` : ""}{error ? "Refresh failed; displayed totals may be out of date." : "Updates every 15 seconds while this tab is open."}</p></div>
      <Card>
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reseller Receivables</h2>
            <p className="text-sm text-slate-500 mt-1">Money Resellers owe SPOTX for purchased licenses; this is incoming payment, not a partner payout.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-slate-500">Outstanding</p>
              <p className="font-semibold text-slate-900">{money(outstandingTotal)}</p>
            </div>
            <div>
              <p className="text-slate-500">Received</p>
              <p className="font-semibold text-emerald-700">{money(receivedTotal)}</p>
            </div>
          </div>
        </div>

        {message && <p role="status" className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{message}</p>}
        {error ? (
          <p role="alert" className="text-red-600 text-sm p-6">{error}</p>
        ) : loading ? (
          <p className="text-slate-400 text-sm p-6">Loading reseller invoices...</p>
        ) : (
          <>
            {unlinkedCount > 0 && (
              <p role="status" className="m-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {unlinkedCount} reseller invoice{unlinkedCount === 1 ? "" : "s"} have no matching partner record; kept visible as unlinked history.
              </p>
            )}
            <Table
              searchable={false}
              empty="No reseller invoices found."
              rows={filtered}
              columns={[
                { key: "partner", header: "Reseller", render: (invoice) => invoice.partnerId?.legalEntity?.businessName || invoice.partnerId?.partnerCode || "Unlinked partner" },
                { key: "invoice", header: "Invoice", render: (invoice) => invoice.invoiceNumber },
                { key: "history", header: "History", render: (invoice) => <button type="button" onClick={() => setHistoryInvoice(invoice)} className="text-xs text-brand-red hover:underline">View history</button> },
                { key: "cheque", header: "Cheque", render: (invoice) => invoice.cheque?.status || "-" },
                {
                  key: "purchase",
                  header: "Purchase",
                  render: (invoice) => (invoice.orderCode ? (
                    <div>
                      <p>{invoice.orderCode} · {invoice.purchasedLicenseSnapshot} licences</p>
                      <p className="text-xs text-slate-400 capitalize">{invoice.billingCycle} bill {invoice.installmentNumber} of {invoice.installmentsInTerm}</p>
                    </div>
                  ) : "—")
                },
                {
                  key: "period",
                  header: "Billing period",
                  render: (invoice) => `${new Date(invoice.billingPeriodStart).toLocaleDateString("en-IN")} – ${new Date(invoice.billingPeriodEnd).toLocaleDateString("en-IN")}`
                },
                {
                  key: "total",
                  header: "Amount due",
                  render: (invoice) => (
                    <InvoiceAmount
                      subtotal={invoice.subtotal}
                      taxAmount={invoice.taxAmount}
                      taxRatePercent={invoice.taxRatePercent}
                      total={invoice.total}
                    />
                  )
                },
                { key: "dueDate", header: "Due date", render: (invoice) => new Date(invoice.dueDate).toLocaleDateString("en-IN") },
                { key: "mode", header: "Collection", render: (invoice) => <span className="capitalize">{invoice.offlinePayment?.method || invoice.paymentMode || "offline"}</span> },
                { key: "status", header: "Payment status", render: (invoice) => <Badge status={invoice.paymentStatus !== "paid" && new Date(invoice.dueDate).getTime() < currentTime ? "overdue" : invoice.paymentStatus} /> },
                {
                  key: "payment",
                  header: "Payment reference",
                  render: (invoice) => invoice.offlinePayment?.transactionId || invoice.razorpay?.paymentId || "—"
                },
                {
                  key: "actions",
                  header: "",
                  render: (invoice) => (
                    <div className="flex items-center gap-3">
                      {invoice.paymentStatus === "paid" && <InvoiceDownload client={adminApi} path={`/admin/reseller/invoices/${invoice._id}/download`} filename={`${invoice.invoiceNumber || "invoice"}.pdf`} />}
                      {invoice.partnerId?._id && (
                        <Link to={`/admin/partners/${invoice.partnerId._id}`} className="text-xs font-semibold text-brand-red hover:underline">Partner</Link>
                      )}
                      {invoice.partnerId && invoice.paymentStatus !== "paid" && invoice.paymentMode !== "online" && (
                        <button
                          type="button"
                          disabled={switchingInvoiceId === invoice._id}
                          onClick={() => switchToOnline(invoice._id)}
                          className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-50"
                        >
                          Switch Online
                        </button>
                      )}
                      {invoice.partnerId && invoice.paymentStatus !== "paid" && (
                        <button
                          type="button"
                          onClick={() => { setVerifyingInvoiceId(invoice._id); setOfflineError(""); }}
                          className="text-xs font-semibold text-brand-red hover:underline"
                        >
                          Verify Payment
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </>
        )}
      </Card>

      <OfflinePaymentModal
        key={verifyingInvoiceId || "invoice-closed"}
        amount={invoices.find((invoice) => invoice._id === verifyingInvoiceId)?.total}
        invoiceNumber={invoices.find((invoice) => invoice._id === verifyingInvoiceId)?.invoiceNumber}
        partnerName={(() => { const partner = invoices.find((invoice) => invoice._id === verifyingInvoiceId)?.partnerId; return partner?.primaryContact?.name || partner?.legalEntity?.businessName || partner?.partnerCode; })()}
        trackCheque
        open={Boolean(verifyingInvoiceId)}
        title="Verify reseller invoice payment"
        error={offlineError}
        onConfirm={verifyOfflinePayment}
        onCancel={() => { setVerifyingInvoiceId(null); setOfflineError(""); }}
      />
    </>
  );
}
