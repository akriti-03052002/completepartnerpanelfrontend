import Pagination from "../../components/ui/Pagination";
import { useSessionState } from "../../hooks/useSessionState";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, History, Landmark, RefreshCw, Search, Info, CalendarX2, X, Clock3, FileText, Download, FolderOpen } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { CommissionAmount, SettlementAmount } from "../../components/ui/FinancialAmount";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const PAYOUT_STATUS_OPTIONS = ["draft", "pending_approval", "approved", "processing", "on_hold", "paid", "failed", "cancelled"];
const OWED_STATUSES = ["draft", "pending_approval", "approved", "processing", "on_hold"];
const HOLDABLE_STATUSES = ["draft", "pending_approval", "approved", "processing"];
// The types SPOTX pays. A Reseller pays SPOTX instead — see Payment from Licence.
const PARTNER_TYPES = ["influencer", "affiliate", "vendor"];

// Settlement cycle, Razorpay-style: how often this partner's payouts run,
// not a per-transaction T+N promise — see SettlementSetting.settlementType.
const CYCLE_LABEL = {
  monthly: "Monthly cycle",
  quarterly: "Quarterly cycle",
  threshold: "Threshold-based",
  manual: "Manual"
};

const maskedAccount = (bankAccount) =>
  bankAccount ? `${bankAccount.bankName} •••• ${bankAccount.accountNumberLast4}` : "—";

const DURATIONS = [
  { key: "all", label: "All time", days: null },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 3 months", days: 90 },
  { key: "365d", label: "Last 1 year", days: 365 }
];

const money = (n, currency = "INR") =>
  `${currency === "INR" ? "₹" : currency + " "}${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
};

export default function AdminSettlements() {
  const [page, setPage] = useSessionState("page", 1);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [statusFilter, setStatusFilter] = useSessionState("statusFilter", "all");
  const [duration, setDuration] = useState("all");
  const [search, setSearch] = useSessionState("search", "");
  // Which type's settlements are shown comes from the menu: "All
  // Settlements" has none; each paid type puts its own in the address.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = searchParams.get("partnerType") || "";
  const partnerTypeFilter = PARTNER_TYPES.includes(requestedType) ? requestedType : "";
  const setPartnerTypeFilter = (type) => { setPage(1); setSearchParams(type ? { partnerType: type } : {}); };
  const [partnerFilterId, setPartnerFilterId] = useState("");
  const [filterPartners, setFilterPartners] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [billActionError, setBillActionError] = useState("");
  const [history, setHistory] = useState([]);

  // { settlementId, paymentId, fetching, payment, error, submitting }
  const [payModal, setPayModal] = useState(null);
  // { mode: "hold" | "fail", settlementId, reason, submitting, error }
  const [reasonModal, setReasonModal] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError("");
    return adminApi.get("/admin/settlements", {
      params: {
        page, limit: 50, todayStart, partnerType: partnerTypeFilter || undefined,
        partnerId: partnerFilterId || undefined
      }
    })
      .then((res) => { setSettlements(res.data.data); setPagination(res.data.pagination); setSummary(res.data.summary || null); setLastFetchedAt(new Date()); })
      .catch((err) => setLoadError(err.response?.data?.message || "Couldn't load settlements."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [partnerTypeFilter, partnerFilterId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live data: the list (and the open settlement's detail, bill and
  // history) reloads quietly every few seconds and whenever this tab is
  // returned to, so a batch created, approved, held or paid elsewhere
  // shows up without a manual refresh. Paused while a dialog is open so
  // nothing shifts under the admin mid-action.
  useAutoRefresh(() => {
    if (payModal || reasonModal) return;
    adminApi.get("/admin/settlements", {
      params: { page, limit: 50, todayStart, partnerType: partnerTypeFilter || undefined, partnerId: partnerFilterId || undefined }
    })
      .then((res) => { setSettlements(res.data.data); setPagination(res.data.pagination); setSummary(res.data.summary || null); setLastFetchedAt(new Date()); setLoadError(""); })
      .catch(() => {});
    if (activeId) {
      adminApi.get(`/admin/settlements/${activeId}`).then((res) => setDetail(res.data.data)).catch(() => {});
      adminApi.get(`/admin/settlements/${activeId}/bill`).then((res) => setBill(res.data.data)).catch(() => {});
      adminApi.get(`/admin/settlements/${activeId}/history`).then((res) => setHistory(res.data.data)).catch(() => {});
    }
  });

  useEffect(() => {
    setPartnerFilterId("");
    adminApi.get("/admin/partners", { params: { partnerType: partnerTypeFilter || undefined } })
      .then((res) => setFilterPartners(res.data.data));
  }, [partnerTypeFilter]);

  const loadBill = (id) => adminApi.get(`/admin/settlements/${id}/bill`).then((res) => setBill(res.data.data));

  useEffect(() => {
    if (!activeId) { setDetail(null); setBill(null); setHistory([]); return; }
    setDetailLoading(true);
    setBillActionError("");
    Promise.all([
      adminApi.get(`/admin/settlements/${activeId}`).then((res) => setDetail(res.data.data)),
      loadBill(activeId),
      adminApi.get(`/admin/settlements/${activeId}/history`).then((res) => setHistory(res.data.data))
    ]).finally(() => setDetailLoading(false));
  }, [activeId]);

  const verifyBillAction = async (status) => {
    setBillActionError("");
    const rejectionReason = status === "rejected" ? window.prompt("Reason for rejecting this bill:") : undefined;
    if (status === "rejected" && rejectionReason === null) return;
    try {
      await adminApi.patch(`/admin/settlements/${activeId}/bill/verify`, { status, rejectionReason });
      await Promise.all([loadBill(activeId), adminApi.get(`/admin/settlements/${activeId}`).then((res) => setDetail(res.data.data))]);
      load();
    } catch (err) {
      setBillActionError(err.response?.data?.message || "Something went wrong verifying the bill.");
    }
  };

  const previousPagePayout = useMemo(
    () => [...settlements].filter((s) => s.partnerId && s.status === "paid").sort((a, b) => new Date(b.payment?.paidAt || 0) - new Date(a.payment?.paidAt || 0))[0],
    [settlements]
  );

  const previousPayout = summary ? summary.previousPayout : previousPagePayout;

  const todaysPayoutTotal = useMemo(
    () => settlements.filter((s) => s.partnerId && isToday(s.payment?.paidAt)).reduce((sum, s) => sum + (s.amount?.net || 0), 0),
    [settlements]
  );

  // Settlements arrive already approved (a commission's approval opens
  // them), so what matters here is how much is ready to be paid right now.
  const pendingApproval = useMemo(() => {
    const rows = settlements.filter((s) => s.partnerId && ["draft", "pending_approval", "approved"].includes(s.status));
    return { count: rows.length, amount: rows.reduce((sum, s) => sum + (s.amount?.net || 0), 0) };
  }, [settlements]);

  const totalOwed = useMemo(
    () => settlements.filter((s) => s.partnerId && OWED_STATUSES.includes(s.status)).reduce((sum, s) => sum + (s.amount?.net || 0), 0),
    [settlements]
  );
  const unlinkedCount = settlements.filter((settlement) => !settlement.partnerId).length;
  const showPayouts = true;
  const visibleStatusOptions = PAYOUT_STATUS_OPTIONS;

  const filtered = useMemo(() => {
    const durationDef = DURATIONS.find((d) => d.key === duration);
    // Measured from the latest refresh, not from when the page first opened.
    const cutoff = durationDef?.days && lastFetchedAt ? lastFetchedAt.getTime() - durationDef.days * 24 * 60 * 60 * 1000 : null;
    const q = search.trim().toLowerCase();

    return settlements.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (cutoff && new Date(s.createdAt).getTime() < cutoff) return false;
      if (q && !(s.settlementNumber?.toLowerCase().includes(q) || s.payment?.transactionId?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [settlements, statusFilter, duration, search, lastFetchedAt]);

  const approve = async (id) => {
    await adminApi.patch(`/admin/settlements/${id}/approve`);
    load();
  };

  // Three ways to mark a settlement paid — see MarkPaidModal. Razorpay verify
  // never takes a transaction ID on faith: it's always fetched live from
  // Razorpay first so the admin sees the real amount/status before
  // confirming, and the backend independently re-fetches/validates it again.
  const openMarkPaid = (id) => setPayModal({
    partnerName: (() => { const partner = settlements.find((item) => item._id === id)?.partnerId; return partner?.primaryContact?.name || partner?.legalEntity?.businessName || partner?.partnerCode || "Partner"; })(),
    confirmed: false,
    settlementId: id, tab: "offline",
    paymentId: "", fetching: false, payment: null, payoutCheck: null,
    payoutDetails: null, loadingDetails: false,
    offlineMethod: "bank_transfer", chequeStatus: settlements.find((item) => item._id === id)?.cheque?.status || "received", referenceNumber: settlements.find((item) => item._id === id)?.cheque?.number || "", note: "",
    error: "", submitting: false
  });

  const fetchRazorpayPayment = async () => {
    if (!payModal.paymentId.trim()) return;
    setPayModal((m) => ({ ...m, fetching: true, error: "", payment: null, payoutCheck: null }));
    // A RazorpayX payout ID ("pout_...") is checked against this settlement
    // (processed, right amount, right bank account) rather than looked up
    // as a gateway payment.
    if (isPayoutId(payModal.paymentId)) {
      try {
        const res = await adminApi.get(`/admin/settlements/${payModal.settlementId}/online-check`, {
          params: { transactionId: payModal.paymentId.trim() }
        });
        setPayModal((m) => ({ ...m, fetching: false, payoutCheck: res.data.data }));
      } catch (err) {
        setPayModal((m) => ({ ...m, fetching: false, error: err.response?.data?.message || "Couldn't check this payout with RazorpayX." }));
      }
      return;
    }
    try {
      const res = await adminApi.get(`/admin/settlements/razorpay-payment/${payModal.paymentId.trim()}`);
      setPayModal((m) => ({ ...m, fetching: false, payment: res.data.data }));
    } catch (err) {
      setPayModal((m) => ({ ...m, fetching: false, error: err.response?.data?.message || "Couldn't fetch this payment from Razorpay." }));
    }
  };

  // Decrypts the partner's account number server-side (audit-logged), so the
  // admin can see exactly which account to pay this settlement into.
  const loadPayoutDetails = async () => {
    setPayModal((m) => ({ ...m, loadingDetails: true, error: "" }));
    try {
      const res = await adminApi.get(`/admin/settlements/${payModal.settlementId}/payout-details`);
      setPayModal((m) => ({ ...m, loadingDetails: false, payoutDetails: res.data.data }));
    } catch (err) {
      setPayModal((m) => ({ ...m, loadingDetails: false, error: err.response?.data?.message || "Couldn't load the partner's bank details." }));
    }
  };

  const confirmMarkPaid = async () => {
    if (!window.confirm("Confirm this partner payment was completed? The settlement will be recorded as paid. This does not send money.")) return;
    setPayModal((m) => ({ ...m, submitting: true, error: "" }));
    try {
      await adminApi.patch(`/admin/settlements/${payModal.settlementId}/mark-paid`, { transactionId: payModal.paymentId.trim() });
      setPayModal(null);
      load();
    } catch (err) {
      setPayModal((m) => ({ ...m, submitting: false, error: err.response?.data?.message || "Couldn't mark this settlement paid." }));
    }
  };

  const confirmMarkPaidOffline = async () => {
    if (!window.confirm("Record this offline payment? Confirm the method, reference and cheque clearance status match your records.")) return;
    if (!payModal.confirmed || !payModal.payoutDetails) return;
    if (!payModal.referenceNumber.trim()) {
      setPayModal((m) => ({ ...m, error: "A reference number (UTR / cheque no. / etc) is required." }));
      return;
    }
    setPayModal((m) => ({ ...m, submitting: true, error: "" }));
    try {
      await adminApi.patch(`/admin/settlements/${payModal.settlementId}/mark-paid-offline`, {
        method: payModal.offlineMethod,
        ...(payModal.offlineMethod === "cheque" ? { chequeStatus: payModal.chequeStatus } : {}),
        referenceNumber: payModal.referenceNumber.trim(),
        note: payModal.note.trim() || undefined
      });
      setPayModal(null);
      load();
    } catch (err) {
      setPayModal((m) => ({ ...m, submitting: false, error: err.response?.data?.message || "Couldn't mark this settlement paid." }));
    }
  };

  // window.prompt() used to be used here — swapped for a real modal since
  // native dialogs silently do nothing in browsers/extensions that block
  // them, and the old code had no error handling either, so any backend
  // rejection (e.g. wrong status) failed completely silently too.
  const openReasonModal = (mode, id) => setReasonModal({ mode, settlementId: id, reason: "", submitting: false, error: "" });

  const submitReasonModal = async () => {
    setReasonModal((m) => ({ ...m, submitting: true, error: "" }));
    try {
      const path = reasonModal.mode === "hold" ? "hold" : "fail";
      await adminApi.patch(`/admin/settlements/${reasonModal.settlementId}/${path}`, { reason: reasonModal.reason });
      setReasonModal(null);
      load();
    } catch (err) {
      setReasonModal((m) => ({ ...m, submitting: false, error: err.response?.data?.message || `Couldn't ${reasonModal.mode === "hold" ? "hold" : "fail"} this settlement.` }));
    }
  };

  const releaseSettlement = async (id) => {
    try {
      await adminApi.patch(`/admin/settlements/${id}/release`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't release this hold.");
    }
  };

  const retrySettlement = async (id) => {
    await adminApi.patch(`/admin/settlements/${id}/retry`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{partnerTypeFilter ? `${partnerTypeFilter[0].toUpperCase()}${partnerTypeFilter.slice(1)} Settlements` : "All Settlements"}</h1>
          {lastFetchedAt && <span className="text-xs text-slate-400">{timeAgo(lastFetchedAt)}</span>}
          <button onClick={load} disabled={loading} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {showPayouts && (
          <p className="text-xs text-slate-500 max-w-xs text-right">
            Settlements are created automatically when a commission is approved — just pay them here.
          </p>
        )}
      </div>

      {showPayouts && <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <OverviewItem
            icon={CheckCircle2}
            iconTone="bg-emerald-50 text-emerald-600"
            label="Previous Payout"
            primary={previousPayout ? money(previousPayout.amount.net, previousPayout.amount.currency) : "No payout yet"}
            secondary={previousPayout?.payment?.paidAt ? new Date(previousPayout.payment.paidAt).toLocaleDateString() : null}
          />
          <OverviewItem
            icon={History}
            iconTone="bg-emerald-50 text-emerald-600"
            label="Today's Payouts"
            primary={money(summary?.today ?? todaysPayoutTotal)}
          />
          <OverviewItem
            icon={Info}
            iconTone="bg-amber-50 text-amber-600"
            label="Ready to Pay"
            primary={`${summary?.pendingCount ?? pendingApproval.count} payments`}
            secondary={money(summary?.pendingAmount ?? pendingApproval.amount)}
          />
          <div className="pt-4 lg:pt-0 lg:pl-6">
            <p className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-4">Payouts Owed to Partners</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{money(summary?.totalOwed ?? totalOwed)}</p>
          </div>
        </div>
      </Card>}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <FilterPill label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
            {visibleStatusOptions.map((s) => (
              <FilterPill key={s} label={s.replace(/_/g, " ")} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={partnerTypeFilter} onChange={(e) => { setPartnerTypeFilter(e.target.value); setStatusFilter("all"); }} className="w-44">
              <option value="">All partner types</option>
              {PARTNER_TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
            </Select>
            <Select value={partnerFilterId} onChange={(e) => { setPage(1); setPartnerFilterId(e.target.value); setStatusFilter("all"); }} className="w-56">
              <option value="">All partners</option>
              {filterPartners.map((p) => (
                <option key={p._id} value={p._id}>{p.legalEntity?.businessName || p.partnerCode} ({p.partnerCode})</option>
              ))}
            </Select>
            <Select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-40">
              {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </Select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search settlement ID / UTR"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-3 w-56 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
              />
            </div>
          </div>
        </div>

        {showPayouts && <Card>
          {loading ? (
            <p className="text-slate-400 text-sm p-6">Loading...</p>
          ) : loadError ? (
            <p role="alert" className="text-red-600 text-sm p-6">{loadError}</p>
          ) : (
            <div>
            {unlinkedCount > 0 && partnerTypeFilter === "" && (
              <p role="status" className="m-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {unlinkedCount} settlement{unlinkedCount === 1 ? "" : "s"} have no matching partner record. They remain visible as unlinked history and cannot be actioned.
              </p>
            )}
            <Table
              searchable={false}
              empty={
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <CalendarX2 size={28} strokeWidth={1.5} />
                  <span>No settlements found</span>
                </div>
              }
              rows={filtered}
              columns={[
                { key: "createdOn", header: "Created On", render: (s) => new Date(s.createdAt).toLocaleDateString() },
                {
                  key: "number",
                  header: "Settlement ID",
                  render: (s) => (
                    <button onClick={() => setActiveId(s._id)} className="font-medium text-brand-red hover:underline">
                      {s.settlementNumber}
                    </button>
                  )
                },
                {
                  key: "partner",
                  header: "Partner",
                  render: (s) => (
                    <div className="flex flex-col gap-0.5">
                      <span>{s.partnerId?.legalEntity?.businessName || s.partnerId?.partnerCode || "Unlinked partner"}</span>
                      <span className="text-xs text-slate-400 capitalize">{s.partnerId?.partnerType || "Unknown type"}</span>
                      {s.partnerId?._id && (
                        <Link
                          to={`/admin/partners/${s.partnerId._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
                        >
                          <FolderOpen size={12} /> View documents
                        </Link>
                      )}
                    </div>
                  )
                },
                {
                  key: "cycle",
                  header: "Cycle",
                  render: (s) => (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock3 size={12} className="text-slate-400" /> {CYCLE_LABEL[s.settlementType] || s.settlementType}
                    </span>
                  )
                },
                {
                  key: "bankAccount",
                  header: "Bank Account",
                  render: (s) => <span className="text-slate-600">{maskedAccount(s.bankAccount)}</span>
                },
                {
                  key: "utr",
                  header: (
                    <span className="inline-flex items-center gap-1">
                      UTR Number <Info size={12} className="text-slate-400" />
                    </span>
                  ),
                  render: (s) => s.payment?.transactionId || "—"
                },
                {
                  key: "net",
                  header: "Net Settlement",
                  render: (s) => <SettlementAmount settlement={s} />
                },
                {
                  key: "bill",
                  header: "Bill",
                  render: (s) => s.bill ? (
                    <div className="flex flex-col gap-1 items-start">
                      <Badge status={s.bill.status} />
                      <BillDownloadButton settlementId={s._id} originalName={s.bill.file?.originalName} />
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )
                },
                { key: "status", header: "Status", render: (s) => <Badge status={s.status} /> },
                {
                  key: "actions",
                  header: "",
                  render: (s) => (
                    <div className="flex gap-3">
                      {s.partnerId && ["draft", "pending_approval"].includes(s.status) && (
                        <button onClick={() => approve(s._id)} className="text-xs font-semibold text-emerald-600 hover:underline">Approve</button>
                      )}
                      {s.partnerId && s.status === "approved" && (
                        <>
                          <button onClick={() => openMarkPaid(s._id)} className="text-xs font-semibold text-brand-red hover:underline">Mark Paid</button>
                          <button onClick={() => openReasonModal("fail", s._id)} className="text-xs font-semibold text-red-600 hover:underline">Mark Failed</button>
                        </>
                      )}
                      {s.partnerId && s.status === "failed" && (
                        <button onClick={() => retrySettlement(s._id)} className="text-xs font-semibold text-amber-600 hover:underline">Retry</button>
                      )}
                      {s.partnerId && HOLDABLE_STATUSES.includes(s.status) && (
                        <button onClick={() => openReasonModal("hold", s._id)} className="text-xs font-semibold text-slate-500 hover:underline">Hold</button>
                      )}
                      {s.partnerId && s.status === "on_hold" && (
                        <button onClick={() => releaseSettlement(s._id)} className="text-xs font-semibold text-emerald-600 hover:underline">Release</button>
                      )}
                    </div>
                  )
                }
              ]}
            />
            </div>
          )}
          {!loading && pagination && <><p className="px-4 text-xs text-slate-500">List search and filters apply to this page. Summary amounts include all matching partners.</p><Pagination {...pagination} onChange={setPage} /></>}
      </Card>}
      </div>

      {activeId && (
        <SettlementDetailPanel
          settlement={detail}
          bill={bill}
          history={history}
          billActionError={billActionError}
          onVerifyBill={verifyBillAction}
          loading={detailLoading}
          onClose={() => setActiveId(null)}
        />
      )}

      {payModal && (
        <MarkPaidModal
          state={payModal}
          setState={setPayModal}
          onFetch={fetchRazorpayPayment}
          onLoadPayoutDetails={loadPayoutDetails}
          onConfirmRazorpay={confirmMarkPaid}
          onConfirmOffline={confirmMarkPaidOffline}
          onClose={() => setPayModal(null)}
        />
      )}

      {reasonModal && (
        <ReasonModal
          state={reasonModal}
          setState={setReasonModal}
          onConfirm={submitReasonModal}
          onClose={() => setReasonModal(null)}
        />
      )}
    </div>
  );
}

// Real modal instead of window.prompt() — native browser dialogs are
// increasingly blocked by browsers/extensions (silently return null, no
// visible failure), and the old code had no error handling either, so any
// backend rejection (wrong status, etc) failed completely invisibly too.
function ReasonModal({ state, setState, onConfirm, onClose }) {
  const isHold = state.mode === "hold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">{isHold ? "Hold settlement" : "Mark payout failed"}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason</label>
          <textarea
            autoFocus
            rows={3}
            value={state.reason}
            onChange={(e) => setState((m) => ({ ...m, reason: e.target.value }))}
            placeholder={isHold ? "Why is this settlement being held?" : "Why did the payout fail?"}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm resize-none"
          />
        </div>

        {state.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{state.error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onConfirm} loading={state.submitting}>
            {isHold ? "Put on Hold" : "Mark Failed"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OverviewItem({ icon: Icon, iconTone, label, primary, secondary }) {
  return (
    <div className="pb-4 lg:pb-0 lg:pr-6 lg:first:pr-6">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconTone}`}>
        <Icon size={16} />
      </div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {secondary && <p className="text-xs text-slate-400 mt-0.5">{secondary}</p>}
      <p className="text-xl font-bold text-slate-900 mt-2">{primary}</p>
    </div>
  );
}

function BillDownloadButton({ settlementId, originalName }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await adminApi.get(`/admin/settlements/${settlementId}/bill/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName || "bill";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Couldn't download this bill.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline disabled:opacity-50">
      <Download size={12} /> {downloading ? "Downloading..." : "Download bill"}
    </button>
  );
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
  created: "Settlement batch created",
  approved: "Approved",
  held: "Put on hold",
  released: "Hold released",
  cheque_received: "Cheque received",
  cheque_bounced: "Cheque bounced",
  paid_offline: "Marked paid (offline)",
  paid_razorpay: "Marked paid (Razorpay verified)",
  failed: "Marked failed",
  retried: "Moved back to approved for retry",
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
            <p className="text-slate-400 text-xs mt-0.5 capitalize">{h.performedByType.replace(/_/g, " ")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettlementDetailPanel({ settlement, bill, history, billActionError, onVerifyBill, loading, onClose }) {
  const gstAmount = bill?.status === "verified" ? bill.amount.gstAmount : 0;
  const payable = settlement ? settlement.amount.net + gstAmount : 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="text-base font-semibold text-slate-900">Settlement details</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading || !settlement ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Settlement ID</p>
                <p className="font-semibold text-slate-900">{settlement.settlementNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Clock3 size={12} className="text-slate-400" /> {CYCLE_LABEL[settlement.settlementType] || settlement.settlementType}
                </span>
                <Badge status={settlement.status} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Landmark size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate">{settlement.partnerId?.legalEntity?.businessName || settlement.partnerId?.partnerCode || "—"}</span>
              </div>
              {settlement.partnerId?._id && (
                <Link
                  to={`/admin/partners/${settlement.partnerId._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline shrink-0"
                >
                  <FolderOpen size={12} /> View documents
                </Link>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Amount breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Gross Amount</span><span className="text-slate-900">{money(settlement.amount.gross, settlement.amount.currency)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fees &amp; Tax Deductions</span><span className="text-red-600">- {money(settlement.amount.deductions, settlement.amount.currency)}</span></div>
                {settlement.tax?.tdsRate > 0 && (
                  <div className="flex justify-between pl-4"><span className="text-slate-400">TDS ({settlement.tax.tdsRate}%)</span><span className="text-slate-400">- {money(settlement.tax.tdsAmount, settlement.amount.currency)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-900 font-medium">Net Commission</span><span className="text-slate-900">{money(settlement.amount.net, settlement.amount.currency)}</span></div>
                {gstAmount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">+ GST ({bill.amount.gstRatePercent}%, per verified bill)</span><span className="text-emerald-600">+ {money(gstAmount, settlement.amount.currency)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold"><span className="text-slate-900">Payable to Partner</span><span className="text-slate-900">{money(payable, settlement.amount.currency)}</span></div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">GST bill</p>
              {!bill ? (
                <p className="text-sm text-slate-400">No bill submitted yet.</p>
              ) : (
                <div className="border border-slate-100 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600"><FileText size={14} className="text-slate-400" /> {bill.billNumber}</span>
                    <Badge status={bill.status} />
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">GSTIN</span><span className="text-slate-900">{bill.gstin}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bill date</span><span className="text-slate-900">{new Date(bill.billDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Total on bill</span><span className="text-slate-900">{money(bill.amount.totalBillAmount, settlement.amount.currency)}</span></div>
                  <BillDownloadButton settlementId={settlement._id} originalName={bill.file.originalName} />
                  {bill.status === "rejected" && bill.rejectionReason && (
                    <p className="text-xs text-red-600 pt-1">Rejected: {bill.rejectionReason}</p>
                  )}
                  {billActionError && <p className="text-xs text-red-600">{billActionError}</p>}
                  {bill.status === "submitted" && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => onVerifyBill("verified")} className="text-xs font-semibold text-emerald-600 hover:underline">Verify</button>
                      <button onClick={() => onVerifyBill("rejected")} className="text-xs font-semibold text-red-600 hover:underline">Reject</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Payout account</p>
              {settlement.bankAccount ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="text-slate-900">{settlement.bankAccount.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="text-slate-900">•••• {settlement.bankAccount.accountNumberLast4}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IFSC</span><span className="text-slate-900">{settlement.bankAccount.ifscMasked || "—"}</span></div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No bank account on file for this partner.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Payment info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="text-slate-900 capitalize">{settlement.payment?.method?.replace(/_/g, " ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Reference / UTR</span><span className="text-slate-900">{settlement.payment?.transactionId || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Settled On</span><span className="text-slate-900">{settlement.payment?.paidAt ? new Date(settlement.payment.paidAt).toLocaleString() : "—"}</span></div>
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
                  Included transactions ({settlement.commissionIds.length})
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

const PAY_TABS = [
  { key: "offline", label: "Offline" },
  { key: "razorpay", label: "Verify Razorpay" }
];

// Two ways to record a payout, sharing one modal:
// - Offline: admin already paid outside Razorpay (bank/UPI/cheque/cash) —
//   trusted on the admin's word, just a reference number.
// - Verify Razorpay: fetch-then-confirm — the payment ID is always
//   resolved against Razorpay first so the admin sees the real amount/
//   status/method before committing, nothing is marked paid on the
//   strength of a typed-in ID alone.
const isPayoutId = (id) => /^pout_/i.test(String(id || "").trim());

function MarkPaidModal({ state, setState, onFetch, onLoadPayoutDetails, onConfirmRazorpay, onConfirmOffline, onClose }) {
  const canConfirmRazorpay = state.payment?.status === "captured" || state.payoutCheck?.ok === true;
  const setTab = (tab) => setState((m) => ({ ...m, tab, error: "" }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">Mark settlement paid</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <p className="text-sm font-medium text-slate-900">{state.partnerName}</p>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {PAY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${
                state.tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {state.error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{state.error}</div>}

        {state.payoutDetails ? (
          <div className="border border-slate-100 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Amount payable</span><span className="font-semibold text-slate-900">{money(state.payoutDetails.payable?.total)}</span></div>
            {state.payoutDetails.bank ? (
              <>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Account holder</span><span className="text-slate-900 text-right">{state.payoutDetails.bank.accountHolderName}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Bank</span><span className="text-slate-900 text-right">{state.payoutDetails.bank.bankName}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Account no.</span><span className="font-mono text-slate-900">{state.payoutDetails.bank.accountNumber}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">IFSC</span><span className="font-mono text-slate-900">{state.payoutDetails.bank.ifsc}</span></div>
              </>
            ) : (
              <p className="text-xs text-amber-700">This partner has no bank account on file.</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoadPayoutDetails}
            disabled={state.loadingDetails}
            className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-50"
          >
            {state.loadingDetails ? "Loading payment details..." : "Review payable amount and bank details"}
          </button>
        )}

        {state.tab === "offline" && (
          <div className="space-y-3">
            {state.offlineMethod === "cheque" && <Select label="Cheque status" value={state.chequeStatus} onChange={(e) => setState((m) => ({ ...m, chequeStatus: e.target.value, confirmed: false }))}><option value="received">Received - awaiting clearance</option><option value="cleared">Cleared - payment completed</option><option value="bounced">Bounced - settlement stays unpaid</option></Select>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Method</label>
              <select
                value={state.offlineMethod}
                onChange={(e) => setState((m) => ({ ...m, offlineMethod: e.target.value, confirmed: false }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference number</label>
              <input
                autoFocus
                value={state.referenceNumber}
                onChange={(e) => setState((m) => ({ ...m, referenceNumber: e.target.value, confirmed: false }))}
                placeholder="UTR / cheque no. / cash receipt no."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
              <input
                value={state.note}
                onChange={(e) => setState((m) => ({ ...m, note: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
              />
            </div>
            <p className="text-xs text-slate-400">No Razorpay verification — this is trusted on your word, same as any other admin-recorded action.</p>
            <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={state.confirmed} onChange={(e) => setState((m) => ({ ...m, confirmed: e.target.checked }))} disabled={!state.payoutDetails || state.submitting} className="mt-1" />I checked the partner, payable amount, method and reference, {state.offlineMethod === "cheque" && state.chequeStatus !== "cleared" ? "and checked the cheque status; payment remains incomplete" : "and completed the payment"}{state.offlineMethod === "cheque" && state.chequeStatus === "cleared" ? " after the cheque cleared" : ""}.</label>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" onClick={onConfirmOffline} loading={state.submitting} disabled={!state.confirmed || !state.payoutDetails || !state.referenceNumber.trim()}>{state.offlineMethod === "cheque" && state.chequeStatus !== "cleared" ? "Record Cheque Status" : "Confirm & Mark Paid"}</Button>
            </div>
          </div>
        )}

        {state.tab === "razorpay" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Razorpay Payment ID or RazorpayX Payout ID</label>
              <div className="flex gap-2">
                <input
                  value={state.paymentId}
                  onChange={(e) => setState((m) => ({ ...m, paymentId: e.target.value, payment: null, payoutCheck: null, error: "" }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onFetch(); } }}
                  placeholder="pay_xxxxxxxxxxxxxx or pout_xxxxxxxxxxxxxx"
                  className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-sm"
                />
                <Button type="button" onClick={onFetch} loading={state.fetching} className="shrink-0 !px-3 !py-2">Fetch</Button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Fetched live from Razorpay — nothing is marked paid until you confirm below.</p>
            </div>

            {state.payment && (
              <div className="border border-slate-100 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><Badge status={state.payment.status} /></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-900">{money(state.payment.amount, state.payment.currency)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="text-slate-900 capitalize">{state.payment.method || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Paid On</span><span className="text-slate-900">{state.payment.createdAt ? new Date(state.payment.createdAt).toLocaleString() : "—"}</span></div>
                {!canConfirmRazorpay && (
                  <p className="text-xs text-amber-700 pt-1">Only a captured payment can be used to mark this settlement paid.</p>
                )}
              </div>
            )}

            {state.payoutCheck && (
              <div className="border border-slate-100 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-slate-500">Payout status</span><Badge status={state.payoutCheck.payout.status} /></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount paid</span><span className="font-semibold text-slate-900">{money(state.payoutCheck.payout.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount payable</span><span className="text-slate-900">{money(state.payoutCheck.payout.expectedAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Paid to</span><span className="text-slate-900">•••• {state.payoutCheck.payout.paidToAccountLast4 || "?"}{state.payoutCheck.payout.paidToIfsc ? ` · ${state.payoutCheck.payout.paidToIfsc}` : ""}</span></div>
                {state.payoutCheck.payout.utr && <div className="flex justify-between"><span className="text-slate-500">UTR</span><span className="text-slate-900">{state.payoutCheck.payout.utr}</span></div>}
                {state.payoutCheck.ok ? (
                  <p className="text-xs text-emerald-700 pt-1">This payout matches the settlement — processed, right amount, right account.</p>
                ) : (
                  <ul className="text-xs text-amber-700 pt-1 space-y-1 list-disc pl-4">
                    {state.payoutCheck.problems.map((problem) => <li key={problem}>{problem}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" onClick={onConfirmRazorpay} loading={state.submitting} disabled={!canConfirmRazorpay}>
                Confirm &amp; Mark Paid
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
