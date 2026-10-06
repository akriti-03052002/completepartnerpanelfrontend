// Where a partner notification should take them — the page for the thing
// it is about (their lead, post / reel, earning, settlement, invoice…),
// which depends on what kind of partner they are.

// Decided by the notification's own type first, where the record alone
// doesn't say enough.
const BY_TYPE = {
  social_account_submitted: "/partner/social-media",
  social_account_verified: "/partner/social-media",
  social_account_rejected: "/partner/social-media",
  payment_rates_updated: "/partner/social-media",
  partner_agreement_issued: "/partner/documents",
  agreement_reissued: "/partner/documents",
  agreement_updated: "/partner/documents",
  kyc_verified_awaiting_bank: "/partner/bank",
  profile_updated_by_admin: "/partner/profile",
  prepayment_awaiting_payment: "/partner/reseller/billing",
  prepayment_done: "/partner/reseller/billing",
  reseller_low_inventory: "/partner/reseller/buy"
};

// Otherwise by the record the notification is about.
const BY_ENTITY = {
  PartnerReferral: "/partner/deals",
  PartnerOpportunity: "/partner/deals",
  InfluencerContentSubmission: "/partner/post-reel",
  PartnerCommission: "/partner/commissions",
  PartnerSettlement: "/partner/settlements",
  PartnerSettlementBill: "/partner/settlements",
  PartnerDocument: "/partner/documents",
  PartnerBankAccount: "/partner/bank",
  PartnerUser: "/partner/team",
  Customer: "/partner/customers",
  ResellerCustomer: "/partner/reseller/customers",
  ResellerInvoice: "/partner/reseller/billing",
  ResellerBillingConfig: "/partner/reseller/billing",
  ScreenLicensePurchaseOrder: "/partner/reseller/buy",
  ResellerInventory: "/partner/reseller/inventory",
  CustomerAllocation: "/partner/reseller/customers"
};

export function notificationLink(notification, partnerType) {
  if (BY_TYPE[notification.type]) return BY_TYPE[notification.type];

  // A new customer referral code belongs with that type's customers page.
  if (notification.type === "referral_code_generated" || notification.type === "customer_registered" || notification.type === "reseller_customer_created") {
    return partnerType === "reseller" ? "/partner/reseller/customers" : "/partner/customers";
  }

  return BY_ENTITY[notification.entity?.type] || "/partner/dashboard";
}
