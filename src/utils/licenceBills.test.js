import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleLicenceBills } from "./licenceBills.js";

test("combines purchases and shows upcoming bills only within seven days", () => {
  const now = new Date("2026-10-06T00:00:00Z");
  const bills = ["order-a", "order-b"].map((orderId) => ({
    orderId, orderCode: orderId, quantity: 100, taxRatePercent: 18,
    installments: [
      { number: 1, status: "upcoming", billDate: "2026-10-05", periodStart: "2026-10-05" },
      { number: 2, status: "upcoming", billDate: "2026-10-13", periodStart: "2026-10-13" },
      { number: 3, status: "upcoming", billDate: "2026-10-14", periodStart: "2026-10-14" }
    ]
  }));
  const invoices = [{ _id: "paid", paymentStatus: "paid", billingPeriodStart: "2026-09-01" },
    { _id: "pending", paymentStatus: "pending", billingPeriodStart: "2026-10-06" }];
  const rows = getVisibleLicenceBills(invoices, bills, now);
  assert.equal(rows.length, 4);
  assert.equal(rows.filter((row) => row.status === "upcoming").length, 2);
  assert.ok(rows.some((row) => row.status === "pending"));
  assert.ok(rows.some((row) => row.status === "paid"));
});

test("does not duplicate an upcoming installment after its invoice is raised", () => {
  const invoice = { _id: "invoice-1", purchaseOrderId: "order-1", billingPeriodStart: "2026-10-10", paymentStatus: "pending" };
  const bills = [{ orderId: "order-1", installments: [{ number: 1, status: "upcoming", billDate: "2026-10-10", periodStart: "2026-10-10" }] }];
  assert.equal(getVisibleLicenceBills([invoice], bills, new Date("2026-10-06")).length, 1);
});
