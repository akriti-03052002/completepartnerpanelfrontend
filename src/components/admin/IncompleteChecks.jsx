import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Table from "../ui/Table";

export default function IncompleteChecks({ partners, kind, renderAction }) {
  return <div className="space-y-4">
    <h2 className="font-semibold text-slate-900">{kind === "bank" ? "Bank checks incomplete" : "Identity checks incomplete"} ({partners.length})</h2>
    {["Waiting for review", "Bank update awaiting review", "Needs correction", "Not submitted"].map(status => {
      const rows = partners.filter(p => p.checkStatus === status);
      if (!rows.length) return null;
      return <section key={status} className="space-y-2">
        <h3 className="text-sm font-semibold">{status} ({rows.length})</h3>
        <Card><Table rows={rows} empty={`No partners: ${status.toLowerCase()}.`} columns={[
          { key: "partner", header: "Partner", render: p => p.legalEntity?.businessName || p.primaryContact?.name || p.partnerCode },
          { key: "type", header: "Type", render: p => p.partnerType },
          ...(kind === "bank" ? [] : [{ key: "missing", header: "Documents incomplete", render: p => p.missing.map(type => `${type.replace(/_/g, " ")}${p.notSubmitted.includes(type) ? " (not submitted)" : ""}`).join(", ") }]),
          { key: "action", header: "", render: p => renderAction?.(p) || <Link to={`/admin/partners/${p._id}/kyc${kind === "bank" ? "#bank-details" : ""}`} className="text-xs font-semibold text-brand-red hover:underline">{status === "Waiting for review" ? "Review" : kind === "bank" ? "Enter bank details" : "Upload documents"}</Link> }
        ]} /></Card>
      </section>;
    })}
  </div>;
}
