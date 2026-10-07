import Pagination from "../../components/ui/Pagination";
import { useSessionState } from "../../hooks/useSessionState";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import { CommissionAmount } from "../../components/ui/FinancialAmount";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useSearchParams } from "react-router-dom";

const STATUSES = ["", "pending", "approved", "eligible", "settled", "cancelled"];
const PARTNER_TYPES = ["", "influencer", "affiliate", "vendor", "reseller"];

const earningLabel = (partnerType) => ({
  influencer: "Content earnings",
  affiliate: "Referral reward",
  vendor: "Customer commission",
  reseller: "Reseller billing (not a payout)"
}[partnerType] || "Commission");

export default function AdminCommissions() {
  const [page, setPage] = useSessionState("page", 1);
  const [pagination, setPagination] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useSessionState("status", "");
  // Which type's commission is shown comes from the menu: "All Commission"
  // has none; Influencer / Affiliate / Vendor each put theirs in the address.
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerType = searchParams.get("partnerType") || "";
  const setPartnerType = (type) => { setPage(1); setSearchParams(type ? { partnerType: type } : {}); };
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi.get("/admin/commissions", {
      params: { page, limit: 50, status: status || undefined, partnerType: partnerType || undefined }
    })
      .then((res) => {
        if (!active) return;
        setCommissions(res.data.data); setPagination(res.data.pagination || null);
        setLoadError("");
      })
      .catch((err) => {
        if (active) setLoadError(err.response?.data?.message || "Couldn't load commissions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [status, partnerType, reloadKey, page]);

  // Kept live, so a commission created by a payment or approval elsewhere
  // appears on its own.
  useAutoRefresh(() => {
    adminApi.get("/admin/commissions", {
      params: { page, limit: 50, status: status || undefined, partnerType: partnerType || undefined }
    })
      .then((res) => { setCommissions(res.data.data); setPagination(res.data.pagination || null); setLoadError(""); })
      .catch(() => {});
  });

  const unlinkedCount = commissions.filter((commission) => !commission.partnerId).length;

  // Approving is the only step before paying: the commission goes straight
  // into a settlement, and the reply says which one.
  const approve = async (id) => {
    if (!window.confirm("Approve this commission? It becomes eligible for a partner payment. This does not transfer money.")) return;
    try {
      const res = await adminApi.patch(`/admin/commissions/${id}/approve`);
      toast.success(res.data.message || "Commission approved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't approve this commission.");
    }
    setReloadKey((key) => key + 1);
  };

  const hold = async (id) => {
    const reason = window.prompt("Reason for putting this commission on hold?") || "";
    await adminApi.patch(`/admin/commissions/${id}/hold`, { reason });
    setReloadKey((key) => key + 1);
  };

  const reverse = async (id) => {
    const reason = window.prompt("Reason for reversing this commission (e.g. customer refunded)?");
    if (reason === null) return;
    try {
      await adminApi.patch(`/admin/commissions/${id}/reverse`, { reason });
      setReloadKey((key) => key + 1);
    } catch (err) {
      window.alert(err.response?.data?.message || "Couldn't reverse this commission.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{partnerType ? `${partnerType[0].toUpperCase()}${partnerType.slice(1)} Commission` : "All Commission"}</h1>
        <div className="flex items-center gap-3">
          <Select value={partnerType} onChange={(e) => setPartnerType(e.target.value)} className="w-48">
            {PARTNER_TYPES.map((type) => (
              <option key={type || "all"} value={type}>{type ? type[0].toUpperCase() + type.slice(1) : "All partner types"}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-48">
            {STATUSES.map((s) => <option key={s || "all"} value={s}>{s ? s.replace(/_/g, " ") : "All statuses"}</option>)}
          </Select>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Reseller financials are license purchases billed by SPOTX, not commission payouts.
      </p>

      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : loadError ? (
          <p role="alert" className="text-red-600 text-sm p-6">{loadError}</p>
        ) : (
          <div>
            {unlinkedCount > 0 && (
              <p role="status" className="m-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {unlinkedCount} commission record{unlinkedCount === 1 ? "" : "s"} have no matching partner record. They remain visible here as unlinked history.
              </p>
            )}
            <Table
              empty="No commissions found."
              rows={commissions}
              columns={[
                { key: "partner", header: "Partner", render: (c) => c.partnerId?.legalEntity?.businessName || (c.partnerId ? "Unnamed partner" : "Unlinked partner") },
                { key: "partnerType", header: "Partner type", render: (c) => <span className="capitalize">{c.partnerId?.partnerType || "Unknown"}</span> },
                { key: "earning", header: "Earning type", render: (c) => earningLabel(c.partnerId?.partnerType) },
                { key: "net", header: "Amount breakdown", render: (c) => <CommissionAmount commission={c} currency={c.transaction?.currency || "INR"} /> },
                { key: "status", header: "Status", render: (c) => <Badge status={c.settlement?.status || "unknown"} /> },
                { key: "date", header: "Earned", render: (c) => new Date(c.createdAt).toLocaleDateString() },
                {
                  key: "actions",
                  header: "",
                  render: (c) => (
                    <div className="flex items-center gap-3">
                      {c.partnerId && c.settlement?.status === "pending" && (
                        <button onClick={() => approve(c._id)} className="text-xs font-semibold text-emerald-600 hover:underline">Approve</button>
                      )}
                      {c.partnerId && c.settlement?.status === "approved" && (
                        <button onClick={() => hold(c._id)} className="text-xs font-semibold text-amber-600 hover:underline">Hold</button>
                      )}
                      {c.partnerId && !["cancelled", "eligible"].includes(c.settlement?.status) && (
                        <button onClick={() => reverse(c._id)} className="text-xs font-semibold text-brand-red hover:underline">Reverse</button>
                      )}
                    </div>
                  )
                }
              ]}
            />
            {pagination && <Pagination {...pagination} onChange={(value) => { setLoading(true); setPage(value); }} />}
          </div>
        )}
      </Card>
    </div>
  );
}
