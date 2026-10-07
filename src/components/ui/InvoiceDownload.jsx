import { useState } from "react";
import { Download } from "lucide-react";

export default function InvoiceDownload({ client, path, filename = "invoice.pdf", label = "Download invoice" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const download = async () => {
    setBusy(true); setError(""); setDownloaded(false);
    try {
      const response = await client.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setDownloaded(true);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Download failed. Please try again.");
    } finally { setBusy(false); }
  };
  return <div><button type="button" disabled={busy} aria-busy={busy} onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-brand-red hover:bg-red-50 hover:underline disabled:opacity-50"><Download size={16} aria-hidden="true" />{busy ? "Downloading..." : label}</button>{error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}{downloaded && <p role="status" className="text-xs text-slate-600 mt-1">Download started. Check your browser downloads.</p>}</div>;
}
