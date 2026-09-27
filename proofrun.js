// proofrun.js：按验证预算校验并留账
import { parentOf, verifyPath } from "./merkletree.js";

function leafValue(name) {
  let total = 0;
  String(name).split("").forEach(function (char) { total += char.charCodeAt(0); });
  return total;
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function codes(spec) {
  return {
    index: spec.index_error_code || "E_INDEX_RANGE",
    duplicate: spec.duplicate_error_code || "E_DUPLICATE_PROOF",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function cloneState(state) {
  return {
    root: state.root,
    verified: state.verified.slice(),
    failed: state.failed.slice(),
    ledger: state.ledger.map(function (row) { return row.slice(); }),
    applied: state.applied.slice()
  };
}

function checkEvent(event, code) {
  if (!event || typeof event !== "object" || event.kind !== "prove"
      || !Number.isInteger(event.index) || !Array.isArray(event.path)
      || !event.path.every(function (value) { return typeof value === "number"; })) {
    fail(code.event, "bad event");
  }
}

function judge(spec, state, index, path) {
  const leaves = spec.leaves || [];
  const value = verifyPath(leafValue(leaves[index]), index, path);
  if (value === state.root) state.verified.push(index);
  else state.failed.push(index);
}

export function step(spec) {
  const events = spec.events || [];
  const code = codes(spec);
  const state = cloneState(spec.state);
  const leaves = spec.leaves || [];
  let budget = typeof spec.budget === "number" ? spec.budget : 0;
  let checked = 0;
  events.forEach(function (event) {
    checkEvent(event, code);
    const index = event.index;
    if (state.applied.indexOf(index) !== -1) return;
    const pending = state.ledger.some(function (row) { return row[0] === index; });
    if (state.verified.indexOf(index) !== -1 || state.failed.indexOf(index) !== -1 || pending) {
      fail(code.duplicate, "duplicate proof for index " + index);
    }
    if (index < 0 || index >= leaves.length) {
      fail(code.index, "index out of range: " + index);
    }
    if (budget > 0) {
      budget -= 1;
      checked += 1;
      judge(spec, state, index, event.path);
    } else {
      state.ledger.push([index, event.path.slice()]);
    }
    state.applied.push(index);
  });
  return { state: state, checked: checked, ledger_before: state.ledger.length,
           ledger: state.ledger, judged: checked, judged_bound: events.length };
}

export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  state.ledger.forEach(function (row) {
    catchup += 1;
    judge(spec, state, row[0], row[1]);
  });
  state.ledger = [];
  return { state: state, catchup: catchup };
}
