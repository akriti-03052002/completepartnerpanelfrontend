import test from "node:test";
import assert from "node:assert/strict";
import { checkOnlinePayment } from "../src/utils/checkOnlinePayment.mjs";

function clock() {
  let time = 0;
  return { now: () => time, wait: async ms => { time += ms; } };
}
test("a delayed success overrides an initial failure without waiting ten minutes", async () => {
  const timer = clock();
  let calls = 0;
  const value = await checkOnlinePayment(async () => (++calls < 3 ? { status: "failed" } : { status: "captured" }), timer);
  assert.equal(value.result.status, "captured");
  assert.equal(value.pending, false);
  assert.equal(timer.now(), 30000);
});
test("unconfirmed result remains pending after ten minutes, never a guessed failure", async () => {
  const timer = clock();
  const value = await checkOnlinePayment(async () => { throw new Error("Network timeout"); }, timer);
  assert.equal(timer.now(), 600000);
  assert.equal(value.pending, true);
  assert.equal(value.result, null);
});
test("failed provider result is shown only after the confirmation window", async () => {
  const timer = clock();
  const value = await checkOnlinePayment(async () => ({ payout: { status: "failed" } }), timer);
  assert.equal(timer.now(), 600000);
  assert.equal(value.pending, false);
});
test("an old failure followed by a network outage remains unconfirmed", async () => {
  const timer = clock();
  let calls = 0;
  const value = await checkOnlinePayment(async () => {
    if (++calls === 1) return { status: "failed" };
    throw new Error("Provider unavailable");
  }, timer);
  assert.equal(value.pending, true);
  assert.equal(value.result, null);
});
test("cancellation stops checks and a recipient mismatch never counts as success", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(checkOnlinePayment(async () => { calls++; }, { signal: controller.signal }));
  assert.equal(calls, 0);
  const value = await checkOnlinePayment(async () => ({ ok: false, payout: { status: "processed" }, checks: { accountMatches: false } }), clock());
  assert.equal(value.result.ok, false);
});
