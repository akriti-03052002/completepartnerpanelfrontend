import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";

const STATUSES = ["", "pending", "allocated", "pending_activation", "active", "suspended", "cancelled"];

export default function AdminResellerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.get("/admin/reseller/customers", {
      params: { search: search || undefined, status: status || undefined }
    })
      .then((res) => {
        if (active) {
          setCustomers(res.data.data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load reseller customers.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [search, status]);

  const submitSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reseller Customers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only oversight of customers registered by reseller partners and their license allocations.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
          <Input
            aria-label="Search reseller customers"
            placeholder="Search company, contact, or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="flex-1"
          />
          <button type="submit" className="rounded-xl bg-brand-black px-4 py-2 text-sm font-semibold text-white hover:bg-charcoal">
            Search
          </button>
        </form>
        <Select aria-label="Filter reseller customers by status" value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-56">
          {STATUSES.map((value) => (
            <option key={value} value={value}>{value ? value.replace(/_/g, " ") : "All statuses"}</option>
          ))}
        </Select>
      </Card>

      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading reseller customers...</p>
        ) : (
          <Table
            searchable={false}
            empty="No reseller customers found."
            rows={customers}
            columns={[
              {
                key: "company",
                header: "Customer",
                render: (customer) => (
                  <div>
                    <p className="font-medium text-slate-900">{customer.businessDetails?.companyName || "—"}</p>
                    <p className="text-xs text-slate-400">{customer.contactDetails?.name || "Contact not provided"}</p>
                  </div>
                )
              },
              {
                key: "contact",
                header: "Contact",
                render: (customer) => (
                  <div>
                    <p>{customer.contactDetails?.email || "—"}</p>
                    {customer.contactDetails?.phone && <p className="text-xs text-slate-400">{customer.contactDetails.phone}</p>}
                  </div>
                )
              },
              {
                key: "reseller",
                header: "Reseller",
                render: (customer) => (
                  <div>
                    <p>{customer.partnerId?.legalEntity?.businessName || "—"}</p>
                    <p className="text-xs text-slate-400">{customer.partnerId?.partnerCode || ""}</p>
                  </div>
                )
              },
              { key: "status", header: "Status", render: (customer) => <Badge status={customer.status} /> },
              {
                key: "licenses",
                header: "Licenses",
                render: (customer) => customer.allocation?.allocatedLicenses ?? "—"
              },
              {
                key: "screens",
                header: "Screens (active)",
                render: (customer) => `${customer.allocation?.registeredScreens ?? 0} (${customer.allocation?.activeScreens ?? 0})`
              },
              { key: "created", header: "Registered", render: (customer) => new Date(customer.createdAt).toLocaleDateString() }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
