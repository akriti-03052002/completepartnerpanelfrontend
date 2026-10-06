// Each partner type signs a different agreement — same names as the
// generated PDF (see backend services/generatePartnerAgreement.js).
const AGREEMENT_NAMES = {
  influencer: "Influencer Agreement",
  affiliate: "Affiliate Referral Agreement",
  vendor: "Vendor Commission Agreement",
  reseller: "Reseller Licence Purchase Agreement"
};

export const agreementName = (partnerType) => AGREEMENT_NAMES[partnerType] || "Partner Agreement";
