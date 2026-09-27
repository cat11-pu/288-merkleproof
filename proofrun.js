// proofrun.js：按验证预算校验并留账（基线：一律给空表）
import { parentOf, verifyPath } from "./merkletree.js";

export function step(spec) {
  return { state: spec.state, checked: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
