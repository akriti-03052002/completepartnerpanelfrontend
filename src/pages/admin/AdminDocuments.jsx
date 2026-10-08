import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import IncompleteChecks from "../../components/admin/IncompleteChecks";

export default function AdminDocuments() {
  const [partners, setPartners] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/admin/documents/pending");
      let incomplete = res.data.incompletePartners;
      if (!Array.isArray(incomplete)) {
        const all = await adminApi.get("/admin/partners");
        const eligible = all.data.data.filter(p => !["rejected", "inactive"].includes(p.status));
        const details = await Promise.all(eligible.map(p => adminApi.get(`/admin/partners/${p._id}`)));
        incomplete = details.flatMap(({ data: response }) => {
          const { partner, documents, requiredDocumentTypes } = response.data;
          const missing = requiredDocumentTypes.filter(type => !documents.some(d => d.documentType === type && d.verification?.status === "verified"));
          if (!missing.length) return [];
          const notSubmitted = missing.filter(type => !documents.some(d => d.documentType === type));
          const awaiting = documents.some(d => missing.includes(d.documentType) && d.verification?.status === "pending");
          return [{ ...partner, missing, notSubmitted, checkStatus: awaiting ? "Waiting for review" : notSubmitted.length ? "Not submitted" : "Needs correction" }];
        });
      }
      setPartners(incomplete); setError("");
    } catch (err) { setError(err.response?.data?.message || "Could not load identity checks."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Identity checks incomplete</h1>
    <p className="text-sm text-slate-500">Each partner appears once. Open their documents to upload missing files or review submitted files.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error} <button onClick={load} className="underline">Try again</button></p>}
    {loading ? <p className="text-sm text-slate-400">Loading identity checks...</p> : !error && <IncompleteChecks partners={partners} kind="documents" />}
  </div>;
}