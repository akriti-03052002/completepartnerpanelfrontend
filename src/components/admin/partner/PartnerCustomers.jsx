import { useSessionState } from "../../../hooks/useSessionState";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import adminApi from "../../../services/adminApi";
import Card from "../../ui/Card";
import Table from "../../ui/Table";
import Badge from "../../ui/Badge";
import Pagination from "../../ui/Pagination";
export default function PartnerCustomers({ partnerId }) {
  const [page, setPage] = useSessionState("page", 1);
  const { data: result, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "partner-customers", partnerId, page],
    queryFn: () => adminApi.get(`/admin/partners/${partnerId}/customers`, { params: { page } }).then(res => res.data),
    refetchInterval: 15000,
    refetchOnWindowFocus: "always"
  });
  return <Card>
    <div className="flex items-center justify-between gap-3 p-4"><h2 className="font-semibold">Customers of this partner</h2><button type="button" onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 text-xs text-slate-600 disabled:opacity-50"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />Refresh</button></div>
    {error ? <p role="alert" className="p-4 text-red-600">{error.response?.data?.message || "Could not load customers."}</p> : result ? <>
      <Table rows={result.data} empty="No customers belong to this partner yet. Customers appear here after registration with this partner's referral link." columns={[
        { key: "name", header: "Customer" }, { key: "contact", header: "Contact" },
        { key: "email", header: "Email" }, { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
        { key: "registeredScreens", header: "Registered screens", render: row => row.registeredScreens ?? "—" },
        { key: "subscribedScreens", header: "Subscribed screens", render: row => row.subscribedScreens ?? row.screens ?? "—" }
      ]} />
      <Pagination page={page} {...result.pagination} onChange={setPage} />
    </> : <p className="p-4 text-slate-500">Loading customers...</p>}
  </Card>;
}
