import { useState } from "react";
import { Download } from "lucide-react";

export default function InvoiceDownload({ client, path, filename = "invoice.pdf", label = "Download invoice" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const download = async () => {
    setBusy(true); setError("");
    try {
      const response = await client.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Download failed. Please try again.");
    } finally { setBusy(false); }
  };
  return <div><button type="button" disabled={busy} onClick={download} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline disabled:opacity-50"><Download size={14} />{busy ? "Downloading..." : label}</button>{error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}</div>;
}
