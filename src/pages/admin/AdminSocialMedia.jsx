import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useSessionState } from "../../hooks/useSessionState";
import Pagination from "../../components/ui/Pagination";
import { useEffect, useState } from "react";
import { ExternalLink, Share2 } from "lucide-react";
import adminApi from "../../services/adminApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ListToolbar from "../../components/ui/ListToolbar";
import { useListFilter } from "../../hooks/useListFilter";

const formatPlatform = (platform) => platform ? platform[0].toUpperCase() + platform.slice(1) : "Social";

// Verified accounts with a price are done here; their rates are edited from
// the influencer's own page. Only accounts still needing a decision or a
// first price stay in this queue.
const needsAction = (account) =>
  account.reviewStatus === "pending" ||
  (account.reviewStatus === "verified" && !account.paymentRates?.post && !account.paymentRates?.reel);

const VIEWS = {
  accounts: {
    title: "Social Account Review",
    subtitle: "Verify influencers' social accounts and set the price paid for posts and reels from each one."
  },
  posts: {
    title: "Post / Reel Review",
    subtitle: "Check submitted post and reel links for ownership and duplicates, then approve to assign the payment."
  }
};

const POST_TABS = [
  { key: "pending", label: "Pending", empty: "Nothing waiting — every post and reel has been reviewed.", activeBadge: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Approved", empty: "No approved posts or reels yet.", activeBadge: "bg-emerald-100 text-emerald-800" },
  { key: "rejected", label: "Rejected", empty: "No rejected posts or reels.", activeBadge: "bg-red-100 text-red-700" }
];

// Two menu items share this page: "accounts" shows account verification,
// "posts" shows post/reel review. Given a `partnerId` it is one
// influencer's tab instead: the same queues, narrowed to that influencer,
// without the page heading.
export default function AdminSocialMedia({ view = "accounts", partnerId = "", onReviewsUpdated }) {
  const [page, setPage] = useSessionState("page", 1);
  const [paging, setPaging] = useState({ total: 0, pages: 0 });
  const [counts, setCounts] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [postTab, setPostTab] = useSessionState("postTab", "pending");
  const [reasons, setReasons] = useState({});
  const [notes, setNotes] = useState({});
  const [ownership, setOwnership] = useState({});
  // Ids whose Reject was clicked without a reason — their reason box turns red.
  const [missingReason, setMissingReason] = useState({});
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchReviews = async () => {
    const [accountResponse, submissionResponse] = await Promise.all([
      view === "accounts" ? adminApi.get("/admin/social-media/accounts") : Promise.resolve({ data: { data: [] } }),
      view === "posts" ? adminApi.get("/admin/social-media/posts", { params: { partnerId: partnerId || undefined, status: postTab, page } }) : Promise.resolve({ data: { data: [], pagination: { total: 0, pages: 0 }, counts: {} } })
    ]);
    return {
      accounts: accountResponse.data.data
        .filter((account) => !partnerId || String(account.partnerId) === String(partnerId))
        .filter(needsAction),
      paging: submissionResponse.data.pagination,
      counts: submissionResponse.data.counts,
      submissions: submissionResponse.data.data
    };
  };

  const load = async () => {
    const result = await fetchReviews();
    setAccounts(result.accounts);
    setSubmissions(result.submissions);
    setPaging(result.paging);
    setCounts(result.counts);
  };

  // Each social account has its own price (reach differs per platform).
  // An empty box means that content type isn't paid for this account.
  const rateValue = (account, type) => rates[account._id]?.[type] ?? (account.paymentRates?.[type] || "");

  const saveRates = async (account) => {
    setBusyId(`rates-${account._id}`);
    setError("");
    setMessage("");
    try {
      const response = await adminApi.patch(`/admin/social-media/accounts/${account.partnerId}/${account._id}/rates`, {
        post: rateValue(account, "post"),
        reel: rateValue(account, "reel"),
        currency: account.paymentRates?.currency || "INR"
      });
      setMessage(`${account.username || account.accountId} (${formatPlatform(account.platform)}): ${response.data.message}`);
      await load();
      onReviewsUpdated?.();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Couldn't update payment rates.");
    } finally {
      setBusyId("");
    }
  };

  useAutoRefresh(() => { if (!document.querySelector('input:focus, textarea:focus, select:focus, dialog[open]')) return load(); });
  useEffect(() => {
    let active = true;
    fetchReviews()
      .then((result) => {
        if (!active) return;
        setAccounts(result.accounts);
        setSubmissions(result.submissions);
        setPaging(result.paging);
        setCounts(result.counts);
      })
      .catch((loadError) => { if (active) setError(loadError.response?.data?.message || "Couldn't load social media reviews."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [partnerId, view, postTab, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // The reason is shown to the influencer, so rejecting needs one. Instead of a
  // dead button, flag the box and put the cursor in it.
  const needsReason = (id, text) => {
    if (text?.trim()) return false;
    setMissingReason((current) => ({ ...current, [id]: true }));
    document.getElementById(`reason-${id}`)?.focus();
    return true;
  };

  const reviewAccount = async (account, decision) => {
    if (decision === "rejected" && needsReason(account._id, reasons[account._id])) return;
    setBusyId(account._id);
    setError("");
    setMessage("");
    try {
      await adminApi.patch(`/admin/social-media/accounts/${account.partnerId}/${account._id}/review`, {
        decision,
        rejectionReason: reasons[account._id] || ""
      });
      setMessage(`Account ${decision}.`);
      await load();
      onReviewsUpdated?.();
    } catch (reviewError) {
      setError(reviewError.response?.data?.message || "Couldn't review this account.");
    } finally {
      setBusyId("");
    }
  };

  const reviewSubmission = async (submission, decision) => {
    if (decision === "rejected" && needsReason(submission._id, notes[submission._id])) return;
    setBusyId(submission._id);
    setError("");
    setMessage("");
    try {
      await adminApi.patch(`/admin/social-media/posts/${submission._id}/review`, {
        decision,
        ownershipConfirmed: Boolean(ownership[submission._id]),
        reviewNote: notes[submission._id] || ""
      });
      setMessage(`Submission ${decision}.`);
      await load();
      onReviewsUpdated?.();
    } catch (reviewError) {
      setError(reviewError.response?.data?.message || "Couldn't review this submission.");
    } finally {
      setBusyId("");
    }
  };

  const accountList = useListFilter(accounts, [
    { label: "Platform", value: (account) => account.platform },
    { label: "Status", value: (account) => account.reviewStatus }
  ]);
  // The tabs pick the status; search and the pick-lists narrow within it.
  const submissionList = useListFilter(submissions.filter((s) => s.status === postTab), [
    { label: "Platform", value: (s) => s.platform },
    { label: "Type", value: (s) => s.contentType },
    { label: "Influencer", value: (s) => s.influencer?.name }
  ]);
  const shownSubmissions = submissionList.visible;

  return (
    <div className="space-y-6">
      {!partnerId && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{VIEWS[view].title}</h1>
          <p className="text-sm text-slate-500 mt-1">{VIEWS[view].subtitle}</p>
        </div>
      )}

      {error && <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {message && <p role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</p>}

      {view === "accounts" && (
      <Card>
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Share2 size={18} className="text-slate-500" />
          <div>
            <h2 className="font-semibold text-slate-900">Influencer account verification</h2>
            <p className="text-xs text-slate-500 mt-0.5">Accounts waiting for review or a first price. Once verified and priced, manage rates from the influencer's page.</p>
          </div>
        </div>
        {loading ? <p className="p-6 text-sm text-slate-400">Loading accounts...</p> : accounts.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nothing to review — every account is verified and priced. Change an account's rates from the influencer's page (Influencers → View).</p>
        ) : (
          <div className="divide-y divide-slate-100">
            <ListToolbar toolbar={accountList.toolbar} placeholder="Search by influencer, username or platform" className="p-3" />
            {accountList.visible.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Nothing matches your search or filters.</p>}
            {accountList.visible.map((account) => (
              <div key={account._id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{account.partnerName} <span className="font-normal text-slate-400">({account.partnerCode})</span></p>
                    <p className="text-sm text-slate-500">{account.email}</p>
                    <p className="mt-2 text-sm text-slate-700">{formatPlatform(account.platform)} · {account.username || account.accountId} · {Number(account.followers || 0).toLocaleString()} followers/subscribers</p>
                    <p className="text-xs text-slate-400 mt-1">Account ID / handle: {account.accountId}</p>
                    {account.rejectionReason && <p className="text-xs text-red-600 mt-1">Previous rejection: {account.rejectionReason}</p>}
                    <p className="mt-3 text-xs font-medium text-slate-500">Pay for content from this {formatPlatform(account.platform)} account</p>
                    <div className="mt-1 flex flex-wrap items-end gap-2">
                      <label className="text-xs text-slate-500">Post ₹
                        <input type="number" min="0" step="0.01" placeholder="Not paid" value={rateValue(account, "post")} onChange={(event) => setRates({ ...rates, [account._id]: { ...(rates[account._id] || {}), post: event.target.value } })} className="ml-1 w-28 px-2 py-1.5 border border-slate-200 rounded-lg" />
                      </label>
                      <label className="text-xs text-slate-500">Reel ₹
                        <input type="number" min="0" step="0.01" placeholder="Not paid" value={rateValue(account, "reel")} onChange={(event) => setRates({ ...rates, [account._id]: { ...(rates[account._id] || {}), reel: event.target.value } })} className="ml-1 w-28 px-2 py-1.5 border border-slate-200 rounded-lg" />
                      </label>
                      <Button type="button" loading={busyId === `rates-${account._id}`} onClick={() => saveRates(account)}>Save rates</Button>
                    </div>
                  </div>
                  <Badge status={account.reviewStatus} />
                </div>
                {account.reviewStatus === "pending" && (
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <div className="flex-1">
                      <input
                        id={`reason-${account._id}`}
                        aria-label={`Rejection reason for ${account.username || account.accountId}`}
                        aria-invalid={Boolean(missingReason[account._id])}
                        value={reasons[account._id] || ""}
                        onChange={(event) => {
                          setReasons({ ...reasons, [account._id]: event.target.value });
                          setMissingReason({ ...missingReason, [account._id]: false });
                        }}
                        placeholder="Reason for rejecting (shown to the influencer)"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${missingReason[account._id] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                      />
                      {missingReason[account._id] && <p className="text-xs text-red-600 mt-1">Type a reason first — the influencer will see it.</p>}
                    </div>
                    <Button type="button" loading={busyId === account._id} onClick={() => reviewAccount(account, "verified")}>Verify account</Button>
                    <Button type="button" variant="danger" loading={busyId === account._id} onClick={() => reviewAccount(account, "rejected")}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      )}

      {view === "posts" && (
      <Card>
        <div className="px-5 pt-4 border-b border-slate-100 flex items-center gap-1">
          {POST_TABS.map((tab) => {
            const count = counts[tab.key] || 0;
            const active = postTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { if (postTab === tab.key && page === 1) return; setLoading(true); setPage(1); setPostTab(tab.key); }}
                className={`px-3 py-2.5 -mb-px border-b-2 text-sm font-semibold transition flex items-center gap-2 ${active ? "border-brand-black text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                {tab.label}
                <span className={`min-w-[22px] px-1.5 py-0.5 rounded-full text-xs ${active ? tab.activeBadge : "bg-slate-100 text-slate-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <ListToolbar toolbar={submissionList.toolbar} placeholder="Search by influencer, link or account" className="p-3 border-b border-slate-100" />
        {loading ? <p className="p-6 text-sm text-slate-400">Loading submissions...</p> : shownSubmissions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{submissionList.toolbar.active ? "Nothing matches your search or filters." : POST_TABS.find((t) => t.key === postTab).empty}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {shownSubmissions.map((submission) => (
              <div key={submission._id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{submission.influencer?.name || "Influencer"} <span className="font-normal text-slate-400">({submission.influencer?.partnerCode})</span></p>
                    <p className="text-sm text-slate-500">{formatPlatform(submission.platform)} · {submission.contentType} · Account: {submission.socialAccount?.username || submission.socialAccount?.accountId || "unavailable"} ({Number(submission.socialAccount?.followers || 0).toLocaleString()} followers)</p>
                    <a href={submission.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline break-all">
                      {submission.url}<ExternalLink size={14} />
                    </a>
                    <p className="text-xs text-slate-400 mt-1">URL is unique across submissions. Confirm the public content belongs to the selected account before approval.</p>
                  </div>
                  <Badge status={submission.status} />
                </div>
                {submission.status === "pending" && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={Boolean(ownership[submission._id])} onChange={(event) => setOwnership({ ...ownership, [submission._id]: event.target.checked })} />
                      I verified URL ownership against the influencer account
                    </label>
                    <div>
                      <input
                        id={`reason-${submission._id}`}
                        aria-label={`Review note for ${submission.url}`}
                        aria-invalid={Boolean(missingReason[submission._id])}
                        value={notes[submission._id] || ""}
                        onChange={(event) => {
                          setNotes({ ...notes, [submission._id]: event.target.value });
                          setMissingReason({ ...missingReason, [submission._id]: false });
                        }}
                        placeholder="Reason for rejecting (shown to the influencer)"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${missingReason[submission._id] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                      />
                      {missingReason[submission._id] && <p className="text-xs text-red-600 mt-1">Type a reason first — the influencer will see it.</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" disabled={!ownership[submission._id]} loading={busyId === submission._id} onClick={() => reviewSubmission(submission, "approved")}>Approve & assign payment</Button>
                      <Button type="button" variant="danger" loading={busyId === submission._id} onClick={() => reviewSubmission(submission, "rejected")}>Reject</Button>
                    </div>
                  </div>
                )}
                {submission.status === "approved" && (
                  <p className="text-sm font-semibold text-emerald-700">Payment approved: ₹{Number(submission.payment?.amount || 0).toLocaleString()} {submission.payment?.currency || "INR"}</p>
                )}
                {submission.reviewNote && submission.status === "rejected" && <p className="text-sm text-red-600">Reason: {submission.reviewNote}</p>}
              </div>
            ))}
          </div>
        )}
        <p className="px-4 text-xs text-slate-400">Search and filters apply to this page of results.</p>
        {!loading && <Pagination page={page} {...paging} onChange={(next) => { setLoading(true); setPage(next); }} />}
      </Card>
      )}
    </div>
  );
}
