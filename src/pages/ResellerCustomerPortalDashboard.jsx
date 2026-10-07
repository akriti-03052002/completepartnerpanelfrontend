import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import customerPortalApi from "../services/resellerCustomerPortalApi";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

// Minimal, read-only — this customer can see their own company info,
// which reseller they're with, and their current screen counts. Nothing
// editable, no payment/price info anywhere (see
// backend/controller/publicResellerCustomerController.js).
export default function CustomerPortalDashboard() {
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["customerPortal", "me"],
    queryFn: () => customerPortalApi.get("/customer-portal/me").then((res) => res.data.data)
  });
  const error = isError ? "Something went wrong loading your account." : "";

  return (
    <div className="max-w-2xl space-y-6">
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">{error} <button type="button" disabled={isFetching} onClick={() => refetch()} className="font-semibold underline">Try again</button></div>}

      {!data && !error && <p className="text-slate-400 text-sm">Loading...</p>}

      {data && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{data.companyName}</h1>
            <p className="text-sm text-slate-500 mt-1">With {data.resellerName}</p>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-900">Account Status</p>
              <Badge status={data.status} />
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">Contact</dt><dd className="font-medium text-slate-900 break-all">{data.contactName || "—"}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900 break-all">{data.email}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900 break-all">{data.phone || "—"}</dd></div>
            </dl>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-900 mb-4">Your Screens</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.screens.allocated}</p>
                <p className="text-xs text-slate-500 mt-1">Screen allowance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-red">{data.screens.active}</p>
                <p className="text-xs text-slate-500 mt-1">Enabled screens</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.screens.suspended}</p>
                <p className="text-xs text-slate-500 mt-1">Paused screens</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">Your allowance is the number of screens your reseller has assigned. Enabled screens can be used; paused screens need your reseller's help.</p>
            <Link to="/reseller/customer/screens" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand-black px-4 text-sm font-semibold text-white hover:bg-charcoal">Manage your screens</Link>
            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
              Questions about your screens or billing? Contact {data.resellerName} directly.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
