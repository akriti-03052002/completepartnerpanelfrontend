import { useSessionState } from "../../../hooks/useSessionState";
import { useEffect, useState } from "react";
import adminApi from "../../../services/adminApi";
import Card from "../../ui/Card";
import Table from "../../ui/Table";
import Badge from "../../ui/Badge";
import Pagination from "../../ui/Pagination";
export default function PartnerCustomers({ partnerId }) {
  const [page, setPage] = useSessionState("page", 1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    adminApi.get(`/admin/partners/${partnerId}/customers`, { params: { page } })
      .then((res) => { if (active) { setResult(res.data); setError(""); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Could not load customers."); });
    return () => { active = false; };
  }, [partnerId, page]);
  return <Card>
    <h2 className="font-semibold p-4">Customers of this partner</h2>
    {error ? <p role="alert" className="p-4 text-red-600">{error}</p> : result ? <>
      <Table rows={result.data} empty="No customers belong to this partner yet. Customers appear here after registration with this partner's referral link." columns={[
        { key: "name", header: "Customer" }, { key: "contact", header: "Contact" },
        { key: "email", header: "Email" }, { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
        { key: "screens", header: "Screens", render: (row) => row.screens ?? "See licence allocation" }
      ]} />
      <Pagination page={page} {...result.pagination} onChange={(next) => { setResult(null); setPage(next); }} />
    </> : <p className="p-4 text-slate-500">Loading customers...</p>}
  </Card>;
}
