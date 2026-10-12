import InvoiceDownload from "../../components/ui/InvoiceDownload";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CalendarClock, RefreshCw, Search, CalendarX2, X, Landmark, FileText, Upload } from "lucide-react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import { CommissionAmount, SettlementAmount } from "../../components/ui/FinancialAmount";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const STATUS_OPTIONS = [
  { key: "waiting", label: "Waiting", statuses: ["draft", "pending_approval", "approved", "processing"] },
  { key: "paid", label: "Paid", statuses: ["paid"] },
  { key: "attention", label: "Needs attention", statuses: ["on_hold", "failed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] }
];
const FILTER_HELP = {
  all: "All payments from SpotX to you. Open a payment to see its details.",
  waiting: "These payments are waiting for SpotX approval or payment. Payment in progress means the payment has started but is not yet confirmed.",
  paid: "These payments are recorded as completed. Open a payment to check the date and bank reference.",
  attention: "These payments failed or are on hold. Open a payment to check the reason and whether you need to submit a bill.",
  cancelled: "These payment records were cancelled. They are not completed payments."
};
const paymentStatus = status => ({ draft: "Waiting for approval", pending_approval: "Waiting for approval", approved: "Waiting for payment", processing: "Payment in progress", on_hold: "On hold", paid: "Paid", failed: "Payment failed", cancelled: "Cancelled" }[status] || status);

const DURATIONS = [
  { key: "all", label: "All time", days: null },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 3 months", days: 90 },
  { key: "365d", label: "Last 1 year", days: 365 }
];

const money = (n, currency = "INR") =>
  `${currency === "INR" ? "₹" : currency + " "}${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
};

export default function Settlements() {
  const { partner } = usePartnerAuth();
  const partnerType = partner?.partnerType?.toLowerCase();
  const earningLabel = partnerType === "affiliate"
    ? "Reward after deductions"
    : partnerType === "influencer"
      ? "Content earnings after deductions"
      : "Commission after deductions";
  const [settlements, setSettlements] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [duration, setDuration] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [history, setHistory] = useState([]);

  const load = () => {
    setLoading(true);
    return api.get("/partner/settlements")
      .then((res) => { setSettlements(res.data.data); setMeta(res.data.meta || {}); setLastFetchedAt(new Date()); setLoadError(""); })
      .catch(() => setLoadError("Could not load your payments. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/partner/settlements")
      .then((res) => {
        setSettlements(res.data.data);
        setMeta(res.data.meta || {});
        setLastFetchedAt(new Date()); setLoadError("");
      })
      .catch(() => setLoadError("Could not load your payments. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // Live data: reloads quietly every few seconds and whenever this tab is
  // returned to, so a settlement SPOTX just created, approved or paid
  // shows up without a manual refresh.
  useAutoRefresh(() => {
    api.get("/partner/settlements")
      .then((res) => { setSettlements(res.data.data); setMeta(res.data.meta || {}); setLastFetchedAt(new Date()); setLoadError(""); })
      .catch(() => setLoadError("Could not refresh payments. Showing the last update."));
  });

  const loadBillForActive = () => api.get(`/partner/settlements/${activeId}/bill`).then((res) => setBill(res.data.data));

  useEffect(() => {
    if (!activeId) return;
    let current = true;
    Promise.all([
      api.get(`/partner/settlements/${activeId}`),
      api.get(`/partner/settlements/${activeId}/bill`),
      api.get(`/partner/settlements/${activeId}/history`)
    ])
      .then(([settlementResponse, billResponse, historyResponse]) => {
        if (!current) return;
        setDetail(settlementResponse.data.data);
        setBill(billResponse.data.data);
        setHistory(historyResponse.data.data);
      })
      .catch((error) => console.error("Couldn't load settlement details:", error.message))
      .finally(() => {
        if (current) setDetailLoading(false);
      });
    return () => { current = false; };
  }, [activeId]);

  const previousSettlement = useMemo(
    () => [...settlements].filter((s) => s.status === "paid").sort((a, b) => new Date(b.payment?.paidAt || 0) - new Date(a.payment?.paidAt || 0))[0],
    [settlements]
  );

  const upcomingAmount = Number(meta.approvedAwaitingBatchAmount) || 0;

  const nextSettlementInfo = useMemo(() => {
    if (meta.nextSettlementDate) {
      return { primary: new Date(meta.nextSettlementDate).toLocaleDateString(), secondary: "Estimated payment date", footnote: upcomingAmount > 0 ? `${money(upcomingAmount, meta.currency)} approved earnings waiting for payment` : undefined };
    }
    if (!meta.hasSettlementSetting) {
      return { primary: "Not set yet", secondary: "Contact SpotX for your payment schedule" };
    }
    if (meta.settlementType === "threshold") {
      return { primary: "When the minimum is reached", secondary: `Minimum earnings: ${money(meta.minimumSettlementAmount, meta.currency)}` };
    }
    if (meta.settlementType === "manual") {
      return { primary: "Set by SpotX", secondary: "SpotX arranges your payment" };
    }
    return { primary: "No date yet", secondary: "SpotX will update your payment here" };
  }, [meta, upcomingAmount]);

  const filtered = useMemo(() => {
    const durationDef = DURATIONS.find((d) => d.key === duration);
    const cutoff = durationDef?.days && lastFetchedAt
      ? lastFetchedAt.getTime() - durationDef.days * 24 * 60 * 60 * 1000
      : null;
    const q = search.trim().toLowerCase();

    return settlements.filter((s) => {
      if (statusFilter !== "all" && !STATUS_OPTIONS.find(option => option.key === statusFilter)?.statuses.includes(s.status)) return false;
      if (cutoff && new Date(s.createdAt).getTime() < cutoff) return false;
      if (q && !(s.settlementNumber?.toLowerCase().includes(q) || s.payment?.transactionId?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [settlements, statusFilter, duration, search, lastFetchedAt]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Payments to You
        </h1>
        {lastFetchedAt && <span className="text-xs text-slate-400">{timeAgo(lastFetchedAt)}</span>}
        <button onClick={load} disabled={loading} aria-label="Refresh payments" className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError} <button type="button" onClick={load} className="font-semibold underline">Try again</button></div>}
      {(!lastFetchedAt && (loading || loadError)) ? <p className="text-sm text-slate-500">Loading your payment summary?</p> : <>
      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <OverviewItem icon={CalendarClock} iconTone="bg-amber-50 text-amber-600" label="Not paid yet" primary={money(meta.availableBalance, meta.currency)} secondary="Includes earnings waiting for approval" />
          <OverviewItem icon={CheckCircle2} iconTone="bg-emerald-50 text-emerald-600" label="Last payment" primary={previousSettlement ? money(previousSettlement.amount.net, previousSettlement.amount.currency) : "No payment yet"} secondary={previousSettlement?.payment?.paidAt ? new Date(previousSettlement.payment.paidAt).toLocaleDateString() : null} />
          <OverviewItem icon={CalendarClock} iconTone="bg-blue-50 text-blue-600" label="Next payment" primary={nextSettlementInfo.primary} secondary={nextSettlementInfo.secondary} footnote={nextSettlementInfo.footnote} />
        </div>
        <p className="text-xs text-slate-500 mt-5">Amounts exclude GST added through an approved bill. Open a payment below for its full amount and any action needed.</p>
      </Card>

      </>}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <FilterPill label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
            {STATUS_OPTIONS.map((option) => (
              <FilterPill key={option.key} label={option.label} active={statusFilter === option.key} onClick={() => setStatusFilter(option.key)} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Payment date range" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-40">
              {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </Select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search payment ID or bank reference"
                aria-label="Search payments"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-3 w-56 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-3" role="status">{FILTER_HELP[statusFilter]}</p>
        <Card>
          {loading ? (
            <p className="text-slate-400 text-sm p-6">Loading...</p>
          ) : (
            <Table
              searchable={false}
              empty={
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <CalendarX2 size={28} strokeWidth={1.5} />
                  <span>No payments found</span>
                </div>
              }
              rows={filtered}
              columns={[
                { key: "createdOn", header: "Created On", render: (r) => new Date(r.createdAt).toLocaleDateString() },
                {
                  key: "number",
                  header: "Payment reference",
                  render: (r) => (
                    <button
                      onClick={() => {
                        setDetailLoading(true);
                        setActiveId(r._id);
                      }}
                      className="font-medium text-brand-red hover:underline"
                    >
                      {r.settlementNumber}
                    </button>
                  )
                },
                {
                  key: "utr",
                  header: "Bank reference",
                  render: (r) => r.payment?.transactionId || "—"
                },
                { key: "net", header: "Payment amount", render: (r) => <SettlementAmount settlement={r} /> },
                { key: "status", header: "Status", render: (r) => <Badge status={r.status}>{paymentStatus(r.status)}</Badge> }
              ]}
            />
          )}
        </Card>
      </div>

      {activeId && (
        <SettlementDetailPanel
          settlement={detailLoading ? null : detail}
          earningLabel={earningLabel}
          billRequired={partnerType === "vendor"}
          bill={detailLoading ? null : bill}
          history={detailLoading ? [] : history}
          onBillSubmitted={() => {
            loadBillForActive();
            api.get(`/partner/settlements/${activeId}`).then((res) => setDetail(res.data.data));
            api.get(`/partner/settlements/${activeId}/history`).then((res) => setHistory(res.data.data));
            load();
          }}
          loading={detailLoading}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}

// Only relevant for GST-registered partners — most partners will never
// see anything here since checkBillRequirement (backend) only holds a
// settlement over this in the first place if a verified GST document is
// on file. bill is null when none has been submitted yet.
function BillSection({ bill, canSubmitBill, billRequired, settlementId, onBillSubmitted, currency }) {
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [gstin, setGstin] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!billNumber || !billDate || !gstin || !file) {
      setError("Bill number, bill date, GSTIN, and a file are all required.");
      return;
    }

    const formData = new FormData();
    formData.append("billNumber", billNumber);
    formData.append("billDate", billDate);
    formData.append("gstin", gstin);
    formData.append("file", file);

    try {
      setSubmitting(true);
      await api.post(`/partner/settlements/${settlementId}/bill`, formData, { headers: { "Content-Type": undefined } });
      setBillNumber(""); setBillDate(""); setGstin(""); setFile(null);
      onBillSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong submitting the bill.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!bill && !canSubmitBill) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400 mb-3">GST bill</p>

      {bill && (
        <div className="border border-slate-100 rounded-xl p-3 space-y-2 text-sm mb-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600"><FileText size={14} className="text-slate-400" /> {bill.billNumber}</span>
            <Badge status={bill.status} />
            <InvoiceDownload client={api} path={`/partner/settlements/${settlementId}/bill/download`} filename={bill.file?.originalName || "bill.pdf"} label="Download bill" />
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Total on bill</span><span className="text-slate-900">{money(bill.amount.totalBillAmount, currency)}</span></div>
          {bill.status === "rejected" && bill.rejectionReason && (
            <p className="text-xs text-red-600 pt-1">Rejected: {bill.rejectionReason}</p>
          )}
          {bill.status === "submitted" && (
            <p className="text-xs text-amber-700 pt-1">Awaiting SPOTX verification — your settlement stays on hold until then.</p>
          )}
        </div>
      )}

      {canSubmitBill && (
        <div className="border border-slate-100 rounded-xl p-3 space-y-2.5">
          <p className="text-xs text-slate-500">{bill?.status === "rejected"
            ? "Submit a corrected bill:"
            : billRequired
              ? "You're GST-registered — submit a bill to release this settlement:"
              : "GST-registered? Submit a bill with your GSTIN and GST is added to this payout. No GST certificate is needed."}</p>
          <input
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            placeholder="Bill / invoice number"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
          />
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
          />
          <input
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="GSTIN"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
          />
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-brand-red rounded-xl py-2 disabled:opacity-50"
          >
            <Upload size={14} /> {submitting ? "Submitting..." : "Submit bill"}
          </button>
        </div>
      )}
    </div>
  );
}


function OverviewItem({ icon: Icon, iconTone, label, primary, secondary, footnote }) {
  return <div className="pb-4 lg:pb-0 ">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconTone}`}><Icon size={16} /></div>
    <p className="text-sm font-medium text-slate-700">{label}</p>
    {secondary && <p className="text-xs text-slate-400 mt-0.5">{secondary}</p>}
    <p className="text-xl font-bold text-slate-900 mt-2">{primary}</p>
    {footnote && <p className="text-xs text-slate-400 mt-0.5">{footnote}</p>}
  </div>;
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
        active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

const HISTORY_ACTION_LABEL = {
  created: "Payment created",
  approved: "Approved",
  held: "Put on hold",
  released: "Hold released",
  paid_offline: "Marked paid",
  paid_razorpay: "Marked paid",
  failed: "Payout failed",
  retried: "Payout retried",
  bill_submitted: "Bill submitted",
  bill_verified: "Bill verified",
  bill_rejected: "Bill rejected"
};

function SettlementHistoryTimeline({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-slate-400">No history yet.</p>;
  }

  return (
    <div className="space-y-3">
      {[...history].reverse().map((h) => (
        <div key={h._id} className="flex gap-3 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{HISTORY_ACTION_LABEL[h.action] || h.action}</span>
              <span className="text-xs text-slate-400 shrink-0">{new Date(h.createdAt).toLocaleString()}</span>
            </div>
            {h.reason && <p className="text-slate-500 text-xs mt-0.5">{h.reason}</p>}
            {h.amount?.total > 0 && (
              <p className="text-slate-500 text-xs mt-0.5">{money(h.amount.total, h.amount.currency)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettlementDetailPanel({ settlement, earningLabel, billRequired, bill, history, onBillSubmitted, loading, onClose }) {
  const gstAmount = bill?.status === "verified" ? bill.amount.gstAmount : 0;
  const payable = settlement ? settlement.amount.net + gstAmount : 0;
  const canSubmitBill = settlement && !["paid", "cancelled"].includes(settlement.status) && (!bill || bill.status === "rejected");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="text-base font-semibold text-slate-900">Payment details</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading || !settlement ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Payment reference</p>
                <p className="font-semibold text-slate-900">{settlement.settlementNumber}</p>
              </div>
              <Badge status={settlement.status}>{paymentStatus(settlement.status)}</Badge>
            </div>

            {/* Amount waterfall: gross -> deductions/TDS -> net, the
                same line-item breakdown Razorpay shows per settlement. */}
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Amount breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Before deductions</span><span className="text-slate-900">{money(settlement.amount.gross, settlement.amount.currency)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="text-red-600">- {money(settlement.amount.deductions, settlement.amount.currency)}</span></div>
                {settlement.tax?.tdsRate > 0 && (
                  <div className="flex justify-between pl-4"><span className="text-slate-400">TDS ({settlement.tax.tdsRate}%)</span><span className="text-slate-400">- {money(settlement.tax.tdsAmount, settlement.amount.currency)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-900 font-medium">{earningLabel}</span><span className="text-slate-900">{money(settlement.amount.net, settlement.amount.currency)}</span></div>
                {gstAmount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">+ GST ({bill.amount.gstRatePercent}%)</span><span className="text-emerald-600">+ {money(gstAmount, settlement.amount.currency)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold"><span className="text-slate-900">Payable to You</span><span className="text-slate-900">{money(payable, settlement.amount.currency)}</span></div>
              </div>
            </div>

            <BillSection bill={bill} canSubmitBill={canSubmitBill} billRequired={billRequired} settlementId={settlement._id} onBillSubmitted={onBillSubmitted} currency={settlement.amount.currency} />

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Payment info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="text-slate-900 capitalize">{settlement.payment?.method?.replace(/_/g, " ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Reference / UTR</span><span className="text-slate-900">{settlement.payment?.transactionId || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Paid on</span><span className="text-slate-900">{settlement.payment?.paidAt ? new Date(settlement.payment.paidAt).toLocaleString() : "—"}</span></div>
              </div>
            </div>

            {settlement.status === "on_hold" && settlement.hold?.reason && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <span className="font-semibold">On hold:</span> {settlement.hold.reason}
              </div>
            )}

            {settlement.status === "failed" && settlement.failureReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {settlement.failureReason}
              </div>
            )}

            {settlement.commissionIds?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-3">
                  Included earnings ({settlement.commissionIds.length})
                </p>
                <div className="space-y-2">
                  {settlement.commissionIds.map((c) => (
                    <div key={c._id} className="flex items-center justify-between text-sm border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Landmark size={14} className="text-slate-400" />
                        {c.transaction?.invoiceNumber || "—"}
                      </div>
                      <CommissionAmount commission={c} currency={settlement.amount.currency} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">History</p>
              <SettlementHistoryTimeline history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
