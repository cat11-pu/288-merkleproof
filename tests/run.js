import assert from "node:assert";
import { parentOf, verifyPath } from "../merkletree.js";
import { step, close } from "../proofrun.js";
import { render } from "../app.js";

const base = {
  budget: 2, leaves: ["a", "b"], root: 0,
  state: { root: 0, verified: [], failed: [], ledger: [], applied: [] },
  events: [],
  index_error_code: "E_INDEX_RANGE", duplicate_error_code: "E_DUPLICATE_PROOF",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("parentOf returns a number", () => {
  assert.strictEqual(typeof parentOf(1, 2), "number");
});

check("verifyPath returns a number", () => {
  assert.strictEqual(typeof verifyPath(1, 0, []), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
