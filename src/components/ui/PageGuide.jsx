import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Link, useLocation } from "react-router-dom";

const partnerJourney = {
  affiliate: ["Complete your profile, identity documents and bank details. SPOTX reviews them before you can refer leads.", "Add a lead: a potential customer interested in SPOTX. Track whether the deal is in progress, won or lost.", "A won deal may earn a reward. Your earnings page shows the reward; Payments to You shows its payment status."],
  influencer: ["Complete your creator profile, identity documents and bank details.", "Connect your social accounts for review, then submit your post or reel links. Account review and content approval are separate checks.", "Approved paid content appears in Content Earnings. Payments to You shows when that money is paid."],
  vendor: ["Complete your profile, identity documents and bank details. SPOTX sets your individual commission terms.", "Invite customers with your referral link or add them yourself. Customers verify their email and manage their screens.", "Customer payments can earn you commission under your agreed terms. Customer payments and payments to you are shown separately."],
  reseller: ["Complete your profile and verification. Check your pricing and required advance payment before requesting licences.", "Request licences, wait for SPOTX approval, then assign them to customers. One licence allows one customer screen.", "Customers register their screens. You pay SPOTX's licence invoices; your customers pay you separately."]
};
const nextPages = {
  affiliate: [["Track leads and deals", "/partner/deals", "referrals:view"], ["Check your rewards", "/partner/commissions", "commissions:view"]],
  influencer: [["Check social accounts", "/partner/social-media", "profile:view"], ["Check posts and reels", "/partner/post-reel", "profile:view"]],
  vendor: [["Manage your customers", "/partner/customers", "customers:view"], ["Check your commission", "/partner/commissions", "commissions:view"]],
  reseller: [["Check available licences", "/partner/reseller/inventory", "reseller:inventory:view"], ["Check bills and due dates", "/partner/reseller/billing", "reseller:billing:view"]]
};
const guides = [
  ["/partner/team", "Manage your team", ["See who can use your partner account and what each person can do.", "Open a member to check their role. Only account owners can invite members or change their access.", "Give each member only the access they need. Removing access does not delete your customer or business records."]],
  ["/partner/profile", "Check your profile", ["Keep your contact and business details accurate so SPOTX can review your account.", "Check the verification checklist for missing information or approvals.", "Review your agreement for your commission terms and payment cycle. Contact SPOTX if something is incorrect."]],
  ["/partner/social-media", "Connect your social accounts", ["Add the social accounts you use to publish your content.", "Account approval checks the account itself. Posts and reels are reviewed separately after you submit their links.", "If an account is rejected, read the reason and correct it before submitting again."]],
  ["/partner/customers", "Manage your customers", ["Find the customers linked to your vendor account and check their current status.", "Add a customer or share your referral link. Customers verify their email before using their account.", "Customer business and your commission are separate amounts. Check Customer Commissions for your recorded earnings."]],
  ["/admin/partners", "Find and manage a partner", ["Choose a partner type, search for a person or business, then open their profile.", "The profile shows their business, verification checklist, documents and payment settings.", "Check the details before saving a change. Account status, document approval and payment status are separate decisions."]],
  ["/admin/social-media/posts", "Review posts and reels", ["Choose a submission and open its link to check the content before deciding.", "Approve valid content or reject it with a clear correction the influencer can make.", "Content approval and payment are separate. Check the recorded earnings and partner payments to follow the money."]],
  ["/admin/social-media/accounts", "Review social accounts", ["Open the submitted account and check that it belongs to the influencer.", "Approve matching details or explain what must be corrected.", "Approving an account does not approve its posts or reels. Review those submissions separately."]],
  ["/admin/leads", "Track leads and deals", ["A lead is a potential customer. Open it to see their requirements and the referring affiliate.", "Update the deal as it progresses. Won means it succeeded; lost means it did not go ahead.", "Deal value is the business amount. The affiliate reward is shown separately in partner earnings."]],

  ["/partner/reseller/inventory", "Understand your screen licences", ["Bought: all licences added to your account. Ready to assign: bought licences that have not been assigned to a customer.", "Assigned: reserved for customers. Registered screens: devices customers have added. Active screens: devices currently enabled.", "SPOTX bills for bought licences according to your agreement, including licences you have not assigned yet."]],
  ["/partner/reseller/buy", "How to request more licences", ["Complete the required one-time advance payment first.", "Enter how many licences you need and submit the request. SPOTX reviews it before licences are added.", "An approved request is billed under your agreed billing schedule. Check the amount and terms before submitting."]],
  ["/partner/reseller/customers", "How to set up a customer", ["Add the customer's details or share your referral link.", "Assign screen licences to that customer from your available balance.", "The customer registers their screens. Assigned licences reserve capacity; they do not mean a screen is already active."]],
  ["/partner/reseller/billing", "Understand your bills", ["Each bill shows what you owe SPOTX and when payment is due.", "Review the licences, tax and total before paying. A downloadable invoice becomes available after successful payment.", "A pending payment is not yet confirmed. Check the invoice status after payment before trying again."]],
  ["/partner/deals", "How leads become rewards", ["Add the potential customer's details and what they need.", "SPOTX reviews the lead and updates the deal. Won means the deal succeeded; pending means a decision is still needed.", "A reward appears in Referral Rewards when it is recorded. A won deal's value is not the amount paid to you."]],
  ["/partner/post-reel", "How content approval works", ["Submit the post or reel link from your social account.", "Waiting for review means SPOTX has not decided yet. If rejected, read the reason before submitting corrected content.", "Approved content earns money only when a payment rate applies. Check Content Earnings for the recorded amount."]],
  ["/partner/documents", "How identity review works", ["Upload the documents requested for your partner type. Use a clear PDF, JPG or PNG within the stated size limit.", "Waiting for review means SPOTX must check the document; you do not need to upload it again.", "If rejected, read the reason and replace the document with a corrected copy."]],
  ["/partner/bank", "How bank verification works", ["Enter the bank account where you want to receive money.", "Complete any verification payment requested on this page. This check is separate from receiving your earnings.", "Wait for review or correct the details if rejected. Review any change carefully before saving."]],
  ["/partner/commissions", "Understand your earnings", ["Each row shows a recorded reward, content payment or customer commission.", "The breakdown explains the amount and deductions. The related customer or deal value is separate from your earnings.", "The status shows whether it is still awaiting approval or payment. Use Payments to You for payment details."]],
  ["/partner/settlements", "Understand payments to you", ["This page tracks money SPOTX pays to you, rather than payments from customers.", "Open a payment to see the earnings included and any deductions.", "Pending or processing means payment is not complete. Paid means it has been recorded as paid; check your bank statement if needed."]],
  ["/admin/documents", "How to review identity documents", ["Open the document and compare its details with the partner profile.", "Approve only when the document is clear and matches. Otherwise reject with a specific correction the partner can make.", "Document approval is one part of verification. Check the partner profile for other required approvals."]],
  ["/admin/bank", "How to review bank details", ["Compare the account holder with the partner and inspect the verification result.", "Approve valid details or explain why they must be corrected. Use an override only after checking the reason carefully.", "A verified bank account does not mean a payout has happened. Payments to partners are managed separately."]],
  ["/admin/commissions", "How to manage partner earnings", ["Check which partner earned the amount and the linked deal, content or customer payment.", "Review the calculation before approving. Cancel or hold only when the reason is recorded clearly.", "Approved earnings and completed payments are different. Open Partner Payments to check whether money was paid."]],
  ["/admin/settlements", "How to manage payments to partners", ["Open the payment and review its earnings, deductions and supporting bill.", "Confirm the payment reference and amount before recording it as paid. Recording a payment does not itself make an offline bank transfer.", "Use the recorded status and reference to follow up on failed or pending payments."]],
  ["/admin/licence-payments", "How to check reseller payments", ["These are licence invoice payments from resellers to SPOTX.", "Check the invoice, due date and payment reference before recording or confirming payment.", "These payments are separate from commission payouts to partners."]],
  ["/admin", "How to review partner work", ["Use Partners to open the correct partner type and profile. The profile checklist shows what still needs approval.", "Read the submitted details and any supporting documents before approving. Add a clear reason when rejecting so the partner can correct it.", "Partner Earnings shows what a partner earns. Partner Payments shows money paid to them. Reseller Bills shows money resellers owe or have paid SPOTX."]],
  ["/reseller/customer", "How to use your screen account", ["Your reseller assigns the number of screens you can register.", "Open Screens to register a device within that allowance. Contact your reseller when you need more screens.", "You pay your reseller directly. This account shows your screen access, not payments to SPOTX."]],
  ["/customer", "How to use your customer account", ["Use Screens to add and manage your devices.", "Use Subscription to review your plan, screen allowance and dates before making changes.", "Use Billing to check recorded invoices and payments. A payment to SPOTX is separate from your vendor's commission."]]
];
export default function PageGuide({ partnerType }) {
  const { pathname } = useLocation();
  const partnerAuth = usePartnerAuth();
  const adminAuth = useAdminAuth();
  let actions = [];
  if (pathname.startsWith("/partner/")) actions = (nextPages[partnerType] || []).filter(([, to, permission]) => to !== pathname && partnerAuth?.hasPermission(permission));
  else if (pathname.startsWith("/reseller/customer/")) actions = [["Manage your screens", "/reseller/customer/screens"]];
  else if (pathname.startsWith("/customer/")) actions = [["Manage your screens", "/customer/screens"], ["Review your subscription", "/customer/subscription"], ["Check paid invoices", "/customer/billing"]];
  else if (pathname.startsWith("/admin/")) {
    actions = [["Find a partner", "/admin/partners"]];
    if (["super_admin", "finance"].includes(adminAuth?.user?.role)) actions.push(["Check reseller bills", "/admin/licence-payments"]);
    if (["super_admin", "kyc_reviewer"].includes(adminAuth?.user?.role)) actions.push(["Review identity documents", "/admin/documents"]);
  }
  actions = actions.filter(([, to]) => to !== pathname);
  const found = guides.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  const steps = found?.[2] || partnerJourney[partnerType];
  if (!steps) return null;
  return (
    <section aria-label="Page help" className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-800">{found?.[1] || "How your partner account works"}</p>
      <p className="mt-1 leading-6 text-slate-600">{steps[0]}</p>
      <details key={pathname} className="mt-2">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Show steps and important details</summary>
        {actions.length > 0 && <div aria-label="Related tasks" className="mt-3 flex flex-wrap gap-2">{actions.map(([label, to]) => <Link key={to} to={to} className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{label}</Link>)}</div>}
        <ol className="mt-3 list-decimal pl-5 space-y-2 leading-6 text-slate-600">{steps.map(step => <li key={step}>{step}</li>)}</ol>
      </details>
    </section>
  );
}
