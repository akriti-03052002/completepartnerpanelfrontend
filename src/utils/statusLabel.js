const LABELS = {
  draft: "Pending",
  pending_approval: "Waiting for approval",
  pending_verification: "Waiting for verification",
  under_review: "Being reviewed",
  not_submitted: "Not submitted",
  eligible: "Ready for payment",
  settled: "Paid",
  captured: "Payment received",
  on_hold: "On hold",
  not_initiated: "Not started",
  pending_activation: "Waiting to start",
  allocated: "Licences assigned",
  trial: "Free trial",
  won: "Deal confirmed",
  lost: "Deal not completed",
  percentage: "Percentage of sale",
  fixed_per_deal: "Fixed amount per deal",
  fixed_per_screen: "Fixed amount per screen",
  recurring_percentage: "Percentage on repeat payments",
  recurring_fixed: "Fixed amount on repeat payments",
  hybrid: "Fixed amount plus percentage"
};
export const statusLabel = value => LABELS[value] || String(value || "").replaceAll("_", " ");
