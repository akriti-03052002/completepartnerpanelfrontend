import Card from "../../ui/Card";
export default function PartnerOverview({ partner, summary = {} }) {
  if (!["vendor", "reseller"].includes(partner.partnerType)) return null;
  return <Card className="p-5">
    <h2 className="font-semibold">Recent customers</h2>
    <p className="text-xs text-slate-500 mt-1">Latest 10 customers. Open the Customers tab for the full list.</p>
    {(summary.recentCustomers || []).length ? <ul className="divide-y mt-3">{summary.recentCustomers.map((customer) => <li key={customer._id} className="py-3 flex justify-between gap-3 text-sm"><span>{customer.companyName || customer.businessDetails?.companyName}</span><span className="text-slate-500">{(customer.subscription?.status || customer.status || "pending").replaceAll("_", " ")}</span></li>)}</ul> : <p className="text-sm text-slate-400 mt-3">No customers yet.</p>}
  </Card>;
}
