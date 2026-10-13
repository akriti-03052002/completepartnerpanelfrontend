import test from "node:test";
import assert from "node:assert/strict";
import { licenceMovement } from "../src/utils/licenceMovement.mjs";

test("licence directions distinguish purchases, assignment, returns and admin deductions", () => {
  const customerId = { businessDetails: { companyName: "Demo cafe" } };
  for (const [type, quantity, expected, phrase] of [
    ["purchase", 10, 10, "SpotX"], ["allocation", -4, -4, "assigned to Demo cafe"],
    ["release", 2, 2, "returned from Demo cafe"], ["cancellation", 4, 4, "cancelling Demo cafe"],
    ["adjustment", -3, -3, "removed through admin"], ["adjustment", 3, 3, "added through admin"]
  ]) {
    const result = licenceMovement({ type, quantity, customerId });
    assert.equal(result.quantity, expected);
    assert.ok(result.description.includes(phrase));
  }
});
test("pausing reduces enabled screens and restarting increases them without changing stored ledger data", () => {
  const stored = { type: "suspension", quantity: 2 };
  assert.equal(licenceMovement(stored).quantity, -2);
  assert.equal(stored.quantity, 2);
  assert.equal(licenceMovement({ type: "reactivation", quantity: 2 }).quantity, 2);
});
