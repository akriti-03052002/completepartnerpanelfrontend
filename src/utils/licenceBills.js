const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getVisibleLicenceBills(invoices, bills, now = new Date()) {
  const rows = invoices.map((invoice) => ({
    _id: invoice._id,
    invoice,
    invoiceNumber: invoice.invoiceNumber,
    orderCode: invoice.orderCode,
    quantity: invoice.purchasedLicenseSnapshot + (invoice.proratedLicenseCount || 0),
    number: invoice.installmentNumber,
    installmentsInTerm: invoice.installmentsInTerm,
    billDate: invoice.billDate || invoice.billingPeriodStart,
    periodStart: invoice.billingPeriodStart,
    periodEnd: invoice.billingPeriodEnd,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    taxRatePercent: invoice.taxRatePercent,
    total: invoice.total,
    status: invoice.paymentStatus
  }));
  const invoiceIds = new Set(invoices.map((invoice) => String(invoice._id)));
  const invoicePeriods = new Set(invoices.filter((invoice) => invoice.purchaseOrderId).map((invoice) =>
    `${invoice.purchaseOrderId}-${new Date(invoice.billingPeriodStart).getTime()}`
  ));
  for (const bill of bills) {
    for (const installment of bill.installments) {
      const billDate = new Date(installment.billDate).getTime();
      const alreadyListed = invoiceIds.has(String(installment.invoiceId)) ||
        invoicePeriods.has(`${bill.orderId}-${new Date(installment.periodStart).getTime()}`);
      if (alreadyListed || installment.status !== "upcoming" ||
          !Number.isFinite(billDate) || billDate < now.getTime() || billDate > now.getTime() + WEEK_MS) continue;
      rows.push({
        ...installment,
        _id: `${bill.orderId}-${installment.number}`,
        orderCode: bill.orderCode,
        quantity: bill.quantity,
        installmentsInTerm: bill.installments.length,
        taxRatePercent: installment.taxRatePercent ?? bill.taxRatePercent
      });
    }
  }
  return rows.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
}
