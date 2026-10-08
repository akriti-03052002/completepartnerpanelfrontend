import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useEffect, useState } from "react";
import { loadIdentityChecks } from "../../services/loadIdentityChecks";
import { useSearchParams } from "react-router-dom";
import IncompleteChecks from "../../components/admin/IncompleteChecks";

export default function AdminDocuments() {
  const [searchParams] = useSearchParams();
  const partnerType = searchParams.get("partnerType") || "";
  const [partners, setPartners] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {

    try {
      const incomplete = await loadIdentityChecks();
      setPartners(incomplete); setError("");
    } catch (err) { setError(err.response?.data?.message || "Could not load identity checks."); }
    finally { setLoading(false); }
  };
  useAutoRefresh(() => { if (!document.querySelector('input:focus, textarea:focus, select:focus, dialog[open]')) return load(); });
  useEffect(() => { load(); }, []);
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Identity checks incomplete</h1>
    <p className="text-sm text-slate-500">Each partner appears once. Open their documents to upload missing files or review submitted files.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error} <button onClick={load} className="underline">Try again</button></p>}
    {loading ? <p className="text-sm text-slate-400">Loading identity checks...</p> : !error && <IncompleteChecks partners={partners.filter(p => !partnerType || p.partnerType === partnerType)} kind="documents" />}
  </div>;
}