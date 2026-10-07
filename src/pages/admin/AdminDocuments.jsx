import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import DocumentPreviewModal from "../../components/admin/DocumentPreviewModal";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  const load = () => adminApi.get("/admin/documents/pending").then((res) => { setDocuments(res.data.data); setError(""); }).catch(() => setError("Could not load documents. Please try again.")).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const verify = async (id, status, rejectionReason) => {
    await adminApi.patch(`/admin/documents/${id}/verify`, { status, rejectionReason });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Identity Documents to Review</h1>

      <p className="text-sm text-slate-500">Open each document, check that it belongs to the partner, then approve it or explain what needs correcting.</p>
      {error && <div role="alert" className="text-sm text-red-700">{error} <button onClick={load} className="font-semibold underline">Try again</button></div>}
      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
          <Table
            empty="No documents waiting for review."
            rows={documents}
            columns={[
              { key: "partner", header: "Partner", render: (d) => d.partnerId?.legalEntity?.businessName || "—" },
              { key: "type", header: "Document", render: (d) => d.documentType.replace(/_/g, " "), filter: (d) => d.documentType },
              { key: "name", header: "File", render: (d) => d.file.originalName },
              { key: "date", header: "Uploaded", render: (d) => new Date(d.createdAt).toLocaleDateString() },
              {
                key: "actions",
                header: "",
                render: (d) => (
                  <button onClick={() => setPreviewDoc(d)} className="text-xs font-semibold text-brand-red hover:underline">Review document</button>
                )
              }
            ]}
          />
        )}
      </Card>

      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onVerify={(id) => verify(id, "verified")}
          onReject={(id, reason) => verify(id, "rejected", reason)}
        />
      )}
    </div>
  );
}
