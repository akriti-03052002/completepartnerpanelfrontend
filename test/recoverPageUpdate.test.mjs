import test from "node:test";
import assert from "node:assert/strict";
import { recoverPageUpdate } from "../src/utils/recoverPageUpdate.mjs";

const missingChunk = new Error("Failed to fetch dynamically imported module: /assets/old.js");
function browserFixture() {
  const values = new Map();
  const browser = {
    navigator: { onLine: true },
    sessionStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    location: { reload: () => { browser.reloads++; } },
    reloads: 0,
  };
  return browser;
}
test("missing deployment assets reload once within the retry window", () => {
  const browser = browserFixture();
  assert.equal(recoverPageUpdate(missingChunk, browser, 100_000), true);
  assert.equal(recoverPageUpdate(missingChunk, browser, 100_001), false);
  assert.equal(browser.reloads, 1);
  assert.equal(recoverPageUpdate(missingChunk, browser, 160_001), true);
});
test("render errors, offline failures and unavailable retry storage do not reload", () => {
  const browser = browserFixture();
  assert.equal(recoverPageUpdate(new Error("Cannot read properties of undefined"), browser), false);
  browser.navigator.onLine = false;
  assert.equal(recoverPageUpdate(missingChunk, browser), false);
  browser.navigator.onLine = true;
  browser.sessionStorage.getItem = () => { throw new Error("Storage blocked"); };
  assert.equal(recoverPageUpdate(missingChunk, browser), false);
  assert.equal(browser.reloads, 0);
});
