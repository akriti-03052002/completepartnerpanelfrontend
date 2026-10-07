import InvoiceDownload from "../../components/ui/InvoiceDownload";
import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import customerApi from "../../services/customerApi";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { visible, toolbar } = useListFilter(invoices, [{ label: "Status", value: (invoice) => invoice.status }]);

  useEffect(() => {
    customerApi.get("/customer/invoices").then((res) => setInvoices(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Billing</h1>

      <ListToolbar toolbar={toolbar} placeholder="Search invoices by date, amount or status" />

      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No invoices yet.</p>
            <p className="text-xs text-slate-400 mt-1">An invoice appears here after each subscription payment.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Status</th><th className="text-left px-5 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Nothing matches your search or filters.</td></tr>
              )}
              {visible.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-5 py-3">{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-medium">{invoice.currency} {invoice.amount.toLocaleString()}</td>
                  <td className="px-5 py-3"><Badge status={invoice.status} /></td><td className="px-5 py-3"><InvoiceDownload client={customerApi} path={`/customer/invoices/${invoice._id}/download`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
