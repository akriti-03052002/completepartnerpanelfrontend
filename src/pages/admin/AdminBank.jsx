import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";

export default function AdminBank() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [error, setError] = useState("");

  const load = () => adminApi.get("/admin/bank/pending").then((res) => setAccounts(res.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const verify = async (account, status) => {
    setError("");
    const razorpayCheck = account.razorpayCheck;
    const razorpayPassed = razorpayCheck?.paymentStatus === "captured" && razorpayCheck?.nameMatchStatus === "matched";

    let overrideReason;
    if (status === "verified" && !razorpayPassed) {
      overrideReason = window.prompt(
        "The Razorpay bank check hasn't passed (payment not captured, or the name doesn't match). Enter a reason to verify anyway:"
      );
      if (!overrideReason?.trim()) return;
    }

    try {
      await adminApi.patch(`/admin/bank/${account._id}/verify`, { status, overrideReason });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this bank account.");
    }
  };

  // A Reseller's staged replacement for an already-verified account — the
  // live account is untouched until this is approved.
  const decideChange = async (account, decision) => {
    setError("");
    let payload = {};
    if (decision === "reject") {
      const rejectionReason = window.prompt("Reason for rejecting this bank account change (shown to the partner):");
      if (rejectionReason === null) return;
      payload = { rejectionReason };
    } else {
      const check = account.pendingChange?.razorpayCheck;
      const razorpayPassed = check?.paymentStatus === "captured" && check?.nameMatchStatus === "matched";
      if (razorpayPassed) {
        if (!window.confirm("Approve this change? The proposed account will replace the partner's current verified account.")) return;
      } else {
        const overrideReason = window.prompt(
          "The Razorpay bank check hasn't passed for the proposed account (payment not captured, or the bank doesn't match). Enter a reason to approve anyway:"
        );
        if (!overrideReason?.trim()) return;
        payload = { overrideReason };
      }
    }

    try {
      await adminApi.patch(`/admin/bank/${account._id}/change/${decision}`, payload);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this bank account change.");
    }
  };

  const reveal = async (id, target) => {
    setError("");
    try {
      const res = await adminApi.get(`/admin/bank/${id}/reveal`, { params: target ? { target } : undefined });
      setRevealed((prev) => ({ ...prev, [target ? `${id}:${target}` : id]: res.data.data }));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reveal this bank account.");
    }
  };

  const newAccounts = accounts.filter((a) => a.verification?.status === "pending");
  const changeRequests = accounts.filter((a) => a.pendingChange);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bank Account Review</h1>
      <p className="text-sm text-slate-500 -mt-4">Revealing full account details is restricted to finance admins and is audit-logged on every access.</p>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <Card>
        {loading ? (
          <p className="text-slate-400 text-sm p-6">Loading...</p>
        ) : (
          <Table
            empty="No bank accounts waiting for review."
            rows={newAccounts}
            columns={[
              { key: "partner", header: "Partner", render: (a) => a.partnerId?.legalEntity?.businessName || "—" },
              { key: "bank", header: "Bank", render: (a) => a.bankName },
              { key: "acct", header: "Account", render: (a) => revealed[a._id] ? `${revealed[a._id].accountNumber} / ${revealed[a._id].ifsc}` : `•••• ${a.accountNumberLast4}` },
              {
                key: "razorpay",
                header: "Razorpay Check",
                filter: (a) => a.razorpayCheck?.paymentStatus || "not_initiated",
                render: (a) => (
                  <div className="flex flex-col gap-1 items-start">
                    <Badge status={a.razorpayCheck?.paymentStatus || "not_initiated"}>
                      {(a.razorpayCheck?.paymentStatus || "not_initiated").replace(/_/g, " ")}
                    </Badge>
                    <Badge status={a.razorpayCheck?.nameMatchStatus === "matched" ? "verified" : a.razorpayCheck?.nameMatchStatus === "mismatched" ? "rejected" : "not_submitted"}>
                      {(a.razorpayCheck?.nameMatchStatus || "not_checked").replace(/_/g, " ")}
                    </Badge>
                  </div>
                )
              },
              {
                key: "actions",
                header: "",
                render: (a) => (
                  <div className="flex gap-3">
                    {!revealed[a._id] && (
                      <button onClick={() => reveal(a._id)} className="text-xs font-semibold text-slate-500 hover:underline">Reveal</button>
                    )}
                    <button onClick={() => verify(a, "verified")} className="text-xs font-semibold text-emerald-600 hover:underline">Verify</button>
                    <button onClick={() => verify(a, "rejected")} className="text-xs font-semibold text-brand-red hover:underline">Reject</button>
                  </div>
                )
              }
            ]}
          />
        )}
      </Card>

      {!loading && changeRequests.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-slate-900">Reseller bank account change requests</h2>
            <p className="text-sm text-slate-500">The partner&apos;s current verified account stays live until a change is approved.</p>
          </div>
          <Card>
            <Table
              empty="No bank account changes waiting for review."
              rows={changeRequests}
              columns={[
                { key: "partner", header: "Partner", render: (a) => a.partnerId?.legalEntity?.businessName || "—" },
                { key: "current", header: "Current Account", render: (a) => `${a.bankName} · •••• ${a.accountNumberLast4}` },
                { key: "holder", header: "Proposed Holder", render: (a) => a.pendingChange.accountHolderName },
                { key: "bank", header: "Proposed Bank", render: (a) => a.pendingChange.bankName },
                {
                  key: "acct",
                  header: "Proposed Account",
                  render: (a) => {
                    const shown = revealed[`${a._id}:pending`];
                    return shown ? `${shown.accountNumber} / ${shown.ifsc}` : `•••• ${a.pendingChange.accountNumberLast4}`;
                  }
                },
                {
                  key: "razorpay",
                  header: "Razorpay Check",
                  filter: (a) => a.razorpayCheck?.paymentStatus || "not_initiated",
                  render: (a) => {
                    const check = a.pendingChange.razorpayCheck;
                    return (
                      <div className="flex flex-col gap-1 items-start">
                        <Badge status={check?.paymentStatus || "not_initiated"}>
                          {(check?.paymentStatus || "not_initiated").replace(/_/g, " ")}
                        </Badge>
                        <Badge status={check?.nameMatchStatus === "matched" ? "verified" : check?.nameMatchStatus === "mismatched" ? "rejected" : "not_submitted"}>
                          {(check?.nameMatchStatus || "not_checked").replace(/_/g, " ")}
                        </Badge>
                      </div>
                    );
                  }
                },
                { key: "submitted", header: "Requested", render: (a) => (a.pendingChange.submittedAt ? new Date(a.pendingChange.submittedAt).toLocaleDateString() : "—") },
                {
                  key: "actions",
                  header: "",
                  render: (a) => (
                    <div className="flex gap-3">
                      {!revealed[`${a._id}:pending`] && (
                        <button onClick={() => reveal(a._id, "pending")} className="text-xs font-semibold text-slate-500 hover:underline">Reveal</button>
                      )}
                      <button onClick={() => decideChange(a, "approve")} className="text-xs font-semibold text-emerald-600 hover:underline">Approve</button>
                      <button onClick={() => decideChange(a, "reject")} className="text-xs font-semibold text-brand-red hover:underline">Reject</button>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
