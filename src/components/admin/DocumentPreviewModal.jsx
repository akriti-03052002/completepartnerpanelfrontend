import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import adminApi from "../../services/adminApi";
import Button from "../ui/Button";

// Lets an admin actually look at the uploaded file before deciding —
// verify/reject used to be a blind call off just the filename.
export default function DocumentPreviewModal({ doc, onClose, onVerify, onReject, client = adminApi, downloadPath }) {
  const panel = useRef(null);
  const [retry, setRetry] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector('button[aria-label="Close"]')?.focus();
    const keyboard = event => {
      if (event.key === "Escape" && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = [...panel.current.querySelectorAll('button:not(:disabled), a[href], iframe, [tabindex="0"]')];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, [onClose, busy]);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    client.get(downloadPath || `/admin/documents/${doc._id}/download`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = window.URL.createObjectURL(res.data);
        setFileUrl(objectUrl);
        setError("");
      })
      .catch(() => { if (!cancelled) setError("Couldn't load a preview of this file."); });

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [doc._id, client, downloadPath, retry]);

  const isImage = doc.file.mimeType?.startsWith("image/");
  const isPdf = doc.file.mimeType === "application/pdf";

  const handleVerify = async () => {
    setBusy(true);
    try {
      await onVerify(doc._id);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Could not save the review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Reason for rejecting this document?");
    if (reason === null) return;
    setBusy(true);
    try {
      await onReject(doc._id, reason);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Could not save the review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Document preview" className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-semibold text-slate-900 capitalize">{doc.documentType.replace(/_/g, " ")}</p>
            <p className="text-xs text-slate-400">{doc.file.originalName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-brand-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-slate-50 flex items-center justify-center p-4">
          {error && <div role="alert" className="text-sm text-red-600">{error} {!fileUrl && <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 font-semibold underline">Retry preview</button>}</div>}
          {!error && !fileUrl && <p className="text-sm text-slate-400">Loading preview...</p>}
          {fileUrl && isImage && (
            <img src={fileUrl} alt={doc.file.originalName} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
          )}
          {fileUrl && isPdf && (
            <iframe src={fileUrl} title={doc.file.originalName} className="w-full h-[60vh] rounded-lg border border-slate-200" />
          )}
          {fileUrl && !isImage && !isPdf && (
            <a href={fileUrl} download={doc.file.originalName} className="text-sm font-semibold text-brand-red hover:underline">
              No inline preview for this file type — click to download
            </a>
          )}
        </div>

        {fileUrl && <div className="px-5 py-3 border-t text-sm"><a href={fileUrl} download={doc.file.originalName} className="text-brand-red font-semibold hover:underline">Download document</a><p className="text-xs text-slate-500 mt-1">If the preview does not display, download the file to open it.</p></div>}
        {doc.verification.status === "pending" && (onVerify || onReject) && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
            {onReject && <Button variant="danger" onClick={handleReject} loading={busy}>Reject document</Button>}
            {onVerify && <Button onClick={handleVerify} loading={busy}>Approve document</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
