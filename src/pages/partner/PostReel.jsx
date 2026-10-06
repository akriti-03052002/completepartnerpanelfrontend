import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

export default function PostReel() {
  const [accounts, setAccounts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ socialAccountId: "", contentType: "post", url: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const verifiedAccounts = accounts.filter((account) => account.reviewStatus === "verified");
  const selectedAccount = verifiedAccounts.find((account) => account._id === form.socialAccountId);
  const selectedRate = selectedAccount?.paymentRates?.[form.contentType] || 0;

  const submissionList = useListFilter(submissions, [
    { label: "Status", value: (s) => s.status },
    { label: "Type", value: (s) => s.contentType },
    { label: "Platform", value: (s) => s.platform }
  ]);
  const visibleSubmissions = submissionList.visible;

  const loadData = async () => {
    const [accountResponse, submissionResponse] = await Promise.all([
      api.get("/partner/social/accounts"),
      api.get("/partner/social/posts")
    ]);
    setAccounts(accountResponse.data.data);
    setSubmissions(submissionResponse.data.data);
    setForm((current) => ({
      ...current,
      socialAccountId: current.socialAccountId || accountResponse.data.data.find((account) => account.reviewStatus === "verified")?._id || ""
    }));
  };

  useEffect(() => {
    Promise.all([
      api.get("/partner/social/accounts"),
      api.get("/partner/social/posts")
    ])
      .then(([accountResponse, submissionResponse]) => {
        setAccounts(accountResponse.data.data);
        setSubmissions(submissionResponse.data.data);
        setForm((current) => ({
          ...current,
          socialAccountId: current.socialAccountId || accountResponse.data.data.find((account) => account.reviewStatus === "verified")?._id || ""
        }));
      })
      .catch((loadError) => setError(loadError.response?.data?.message || "Couldn't load posts and accounts."))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post("/partner/social/posts", form);
      setForm((current) => ({ ...current, url: "" }));
      setMessage("Your content was submitted for review.");
      await loadData();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Couldn't submit this content.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post / Reel</h1>
        <p className="text-sm text-slate-500 mt-1">Submit a public content URL from one of your verified social accounts.</p>
      </div>

      <Card className="p-6">
        {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
        {message && <p role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}
        {loading ? (
          <p className="text-sm text-slate-400">Loading your accounts...</p>
        ) : verifiedAccounts.length > 0 ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Verified account" value={form.socialAccountId} onChange={(event) => setForm({ ...form, socialAccountId: event.target.value })} required>
                {verifiedAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.platform[0].toUpperCase() + account.platform.slice(1)} · {account.username || account.accountId}
                  </option>
                ))}
              </Select>
              <Select label="Content type" value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value })}>
                <option value="post">Post</option>
                <option value="reel">Reel / short video</option>
              </Select>
            </div>
            {selectedAccount && (
              selectedRate ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  You&apos;ll earn <span className="font-semibold">₹{selectedRate.toLocaleString("en-IN")}</span> when this {form.contentType} is approved.
                </p>
              ) : (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No {form.contentType} rate is set for this account yet, so it can&apos;t be paid until SPOTX sets one.
                </p>
              )
            )}
            <Input label="Post / reel URL" type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." required />
            <Button type="submit" loading={busy}>Submit for review</Button>
          </form>
        ) : error && accounts.length === 0 ? null : (
          <div className="text-sm text-slate-600">
            {accounts.length === 0
              ? "Submit a social account first. You can submit content after an admin verifies it."
              : "Your social account is awaiting verification. You can submit content after an admin verifies it."}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Your submissions</h2>
        </div>
        <ListToolbar toolbar={submissionList.toolbar} placeholder="Search by link, platform or status" className="p-3 border-b border-slate-100" />
        {loading ? <p className="p-6 text-sm text-slate-400">Loading submissions...</p> : error && submissions.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Couldn&apos;t load your submissions. Refresh the page to try again.</p>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <Clapperboard size={24} className="mx-auto mb-2 text-slate-300" />
            No posts or reels submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleSubmissions.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-400">Nothing matches your search or filters.</p>
            )}
            {visibleSubmissions.map((submission) => (
              <div key={submission._id} className="p-5 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 capitalize">{submission.platform} · {submission.contentType}</p>
                  <a className="text-sm text-blue-700 hover:underline break-all" href={submission.url} target="_blank" rel="noreferrer">{submission.url}</a>
                  {submission.reviewNote && <p className="text-xs text-red-600 mt-1">Admin note: {submission.reviewNote}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={submission.status} />
                  {submission.payment?.status === "approved" && (
                    <span className="text-sm font-semibold text-emerald-700">₹{Number(submission.payment.amount).toLocaleString()} approved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
