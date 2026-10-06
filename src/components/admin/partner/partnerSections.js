import { LayoutDashboard, UserCircle, Users, Trophy, Landmark, FileCheck, Wallet, UserCog, History, Clapperboard, Share2 } from "lucide-react";

const ALL_TYPES = ["influencer", "affiliate", "vendor", "reseller"];
// Resellers pay SPOTX for licenses instead of earning, so they have no
// earnings ledger, settlements or payout schedule.
const EARNING_TYPES = ["influencer", "affiliate", "vendor"];

// What each earning type's ledger is called — same wording as the
// partner's own sidebar (see PartnerLayout).
const EARNINGS_LABEL = {
  influencer: "Content Earnings",
  affiliate: "Rewards",
  vendor: "Commissions"
};

// Sections of one partner, shown as the tab bar on its admin page and
// routed as /admin/partners/:id/:section (overview has no suffix, so
// opening a partner lands on it). Which tabs appear depends on the
// partner's type.
const PARTNER_SECTIONS = [
  { key: "overview", label: () => "Overview", icon: LayoutDashboard, partnerTypes: ALL_TYPES },
  { key: "details", label: () => "Details", icon: UserCircle, partnerTypes: ALL_TYPES },
  { key: "posts", label: () => "Post / Reel Approval", icon: Clapperboard, partnerTypes: ["influencer"] },
  { key: "accounts", label: () => "Account Approval", icon: Share2, partnerTypes: ["influencer"] },
  { key: "leads", label: () => "Leads", icon: Users, partnerTypes: ["affiliate"] },
  { key: "rewards", label: (type) => EARNINGS_LABEL[type] || "Earnings", icon: Trophy, partnerTypes: EARNING_TYPES },
  { key: "settlements", label: () => "Settlements", icon: Landmark, partnerTypes: EARNING_TYPES },
  { key: "kyc", label: () => "KYC & Bank", icon: FileCheck, partnerTypes: ALL_TYPES },
  { key: "payout", label: () => "Payout Settings", icon: Wallet, partnerTypes: EARNING_TYPES },
  { key: "team", label: () => "Team", icon: UserCog, partnerTypes: ["affiliate", "vendor", "reseller"] },
  { key: "activity", label: () => "Activity", icon: History, partnerTypes: ALL_TYPES }
];

export const sectionsForPartnerType = (partnerType) =>
  PARTNER_SECTIONS
    .filter((section) => section.partnerTypes.includes(partnerType))
    .map((section) => ({ key: section.key, label: section.label(partnerType), icon: section.icon }));

export const partnerSectionPath = (id, key) =>
  key === "overview" ? `/admin/partners/${id}` : `/admin/partners/${id}/${key}`;
