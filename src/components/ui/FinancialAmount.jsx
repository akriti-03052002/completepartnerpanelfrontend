const money = (value, currency = "INR") =>
  `${currency === "INR" ? "₹" : `${currency} `}${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function SettlementAmount({ settlement }) {
  const { amount = {}, tax = {} } = settlement;
  const verifiedGstAmount = settlement.bill?.status === "verified"
    ? Number(settlement.bill.amount?.gstAmount) || 0
    : 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-slate-900">{money(amount.net, amount.currency)}</span>
      <span className="text-xs text-slate-400">
        {money(amount.gross, amount.currency)} gross − {money(amount.deductions, amount.currency)} deductions = net
      </span>
      {tax.tdsRate > 0 && (
        <span className="text-xs text-slate-400">
          Includes TDS {tax.tdsRate}% ({money(tax.tdsAmount, amount.currency)})
        </span>
      )}
      {verifiedGstAmount > 0 && (
        <span className="text-xs text-slate-400">
          + GST ({settlement.bill.amount.gstRatePercent}%): {money(verifiedGstAmount, amount.currency)} = payable {money(amount.net + verifiedGstAmount, amount.currency)}
        </span>
      )}
    </div>
  );
}

export function CommissionAmount({ commission, currency = "INR" }) {
  const calculation = commission.calculation || {};
  const type = calculation.commissionType || "";
  let basis = "";

  if (["percentage", "recurring_percentage"].includes(type) && calculation.rate > 0) {
    basis = `${money(commission.transaction?.revenue, currency)} revenue × ${calculation.rate}%`;
  } else if (["fixed_per_deal", "recurring_fixed"].includes(type) && calculation.fixedAmount > 0) {
    basis = `Fixed amount: ${money(calculation.fixedAmount, currency)}`;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-slate-900">{money(calculation.netCommission, currency)}</span>
      <span className="text-xs text-slate-400">
        {money(calculation.grossCommission, currency)} gross − {money(calculation.deductions, currency)} deductions = net
      </span>
      {basis && <span className="text-xs text-slate-400">{basis}</span>}
    </div>
  );
}

export function InvoiceAmount({ subtotal, taxAmount, taxRatePercent, total, currency = "INR", quantity, unitPrice }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-slate-900">{money(total, currency)}</span>
      <span className="text-xs text-slate-400">
        {money(subtotal, currency)} subtotal + {money(taxAmount, currency)} GST ({Number(taxRatePercent) || 0}%)
      </span>
      {quantity != null && unitPrice != null && (
        <span className="text-xs text-slate-400">{quantity} × {money(unitPrice, currency)}</span>
      )}
    </div>
  );
}
