// app.js：渲染结果
import { parentOf, verifyPath } from "./merkletree.js";
import { step, close } from "./proofrun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { events: events, budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      root: state.root, verified: state.verified.slice().sort(),
      failed: state.failed.slice().sort(), ledger: state.ledger, applied: state.applied.length
    });
  };
  const leaves = spec.leaves || [];
  let level = leaves.map(function (name) {
    let total = 0;
    String(name).split("").forEach(function (char) { total += char.charCodeAt(0); });
    return total;
  });
  while (level.length > 1) {
    const next = [];
    for (let spot = 0; spot < level.length; spot += 2) {
      next.push(parentOf(level[spot], spot + 1 < level.length ? level[spot + 1] : level[spot]));
    }
    level = next;
  }
  return { root: level.length ? level[0] : 0,
           verified: closed.state.verified.slice().sort(),
           failed: closed.state.failed.slice().sort(),
           checked_first: first.checked, checked_wide: wide.checked,
           pair_differs: first.checked !== wide.checked,
           ledger_before: first.ledger_before, ledger: first.ledger,
           catchup: closed.catchup, ledger_after: closed.state.ledger.length,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.checked, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length,
           tail: parentOf(1, 1) + verifyPath(1, 0, []).valueOf() % 1 };
}
