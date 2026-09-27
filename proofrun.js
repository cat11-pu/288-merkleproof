// proofrun.js：按验证预算校验并留账
import { parentOf, verifyPath } from "./merkletree.js";

function leafValue(leaves, index) {
  let total = 0;
  String(leaves[index]).split("").forEach(function (char) { total += char.charCodeAt(0); });
  return total;
}

function cloneState(state) {
  const source = state || {};
  return {
    root: typeof source.root === "number" ? source.root : 0,
    verified: (source.verified || []).slice(),
    failed: (source.failed || []).slice(),
    ledger: (source.ledger || []).map(function (row) { return [row[0], row[1].slice()]; }),
    applied: (source.applied || []).slice()
  };
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function checkEvent(spec, event) {
  if (!event || event.kind !== "prove" || !Number.isInteger(event.index) || !Array.isArray(event.path)) {
    fail(spec.event_error_code || "E_BAD_EVENT", "bad event");
  }
}

function judge(state, leaves, index, path) {
  const value = verifyPath(leafValue(leaves, index), index, path);
  if (value === state.root) state.verified.push(index);
  else state.failed.push(index);
  state.applied.push(index);
}

export function step(spec) {
  const leaves = spec.leaves || [];
  const events = spec.events || [];
  const state = cloneState(spec.state);
  let budget = spec.budget || 0;
  let checked = 0;
  const carried = state.ledger.length;
  const seen = {};
  const pending = [];
  state.ledger.forEach(function (row) {
    if (budget > 0) {
      budget -= 1;
      checked += 1;
      seen[row[0]] = true;
      judge(state, leaves, row[0], row[1]);
    } else {
      pending.push(row);
    }
  });
  state.ledger = pending;
  events.forEach(function (event) {
    checkEvent(spec, event);
    const index = event.index;
    if (state.applied.indexOf(index) !== -1) return;
    if (seen[index]) fail(spec.duplicate_error_code || "E_DUPLICATE_PROOF", "duplicate proof");
    if (index < 0 || index >= leaves.length) {
      fail(spec.index_error_code || "E_INDEX_RANGE", "index out of range");
    }
    if (state.verified.indexOf(index) !== -1 || state.failed.indexOf(index) !== -1) {
      fail(spec.duplicate_error_code || "E_DUPLICATE_PROOF", "duplicate proof");
    }
    if (state.ledger.some(function (row) { return row[0] === index; })) return;
    seen[index] = true;
    if (budget > 0) {
      budget -= 1;
      checked += 1;
      judge(state, leaves, index, event.path);
    } else {
      state.ledger.push([index, event.path.slice()]);
    }
  });
  return {
    state: state,
    checked: checked,
    ledger_before: state.ledger.length,
    ledger: state.ledger,
    judged: checked,
    judged_bound: events.length + carried
  };
}

export function close(spec) {
  const leaves = spec.leaves || [];
  const state = cloneState(spec.state);
  const pending = state.ledger;
  state.ledger = [];
  let catchup = 0;
  pending.forEach(function (row) {
    if (state.applied.indexOf(row[0]) !== -1) return;
    catchup += 1;
    judge(state, leaves, row[0], row[1]);
  });
  return { state: state, catchup: catchup };
}
