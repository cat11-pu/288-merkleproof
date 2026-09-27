// ui.js：操作面板与视图（原生 DOM，无弹窗）
import { render } from "./app.js";

export function mount(spec, parts) {
  parts.log.textContent = "事件 " + (spec.events || []).length + " 条，叶子 " + (spec.leaves || []).length + " 片，本轮验证预算 " + (spec.budget || 0) + " 份证明。";

  function draw() {
    let view = null;
    try {
      view = render(spec);
    } catch (error) {
      parts.out.textContent = String(error && error.code ? error.code : error);
      parts.log.textContent = "跑不动：" + String(error && error.message ? error.message : error);
      return;
    }
    parts.out.textContent = JSON.stringify(view, null, 1);
    parts.stage.textContent = "";
    const rootLine = document.createElement("div");
    rootLine.className = "row";
    const head = document.createElement("span");
    head.textContent = "根值 " + view.root;
    rootLine.appendChild(head);
    const chip = document.createElement("span");
    chip.className = "chip ok";
    chip.textContent = "已算";
    rootLine.appendChild(chip);
    parts.stage.appendChild(rootLine);
    (view.verified || []).forEach(function (index) {
      const line = document.createElement("div");
      line.className = "row";
      const head = document.createElement("span");
      head.textContent = "下标 " + index + " 的证明通过";
      line.appendChild(head);
      const chip = document.createElement("span");
      chip.className = "chip ok";
      chip.textContent = "对得上根";
      line.appendChild(chip);
      parts.stage.appendChild(line);
    });
    (view.failed || []).forEach(function (index) {
      const line = document.createElement("div");
      line.className = "row";
      const head = document.createElement("span");
      head.textContent = "下标 " + index + " 的证明不通过";
      line.appendChild(head);
      const chip = document.createElement("span");
      chip.className = "chip bad";
      chip.textContent = "对不上根";
      line.appendChild(chip);
      parts.stage.appendChild(line);
    });
    (view.ledger || []).forEach(function (row) {
      const line = document.createElement("div");
      line.className = "row";
      const head = document.createElement("span");
      head.textContent = "下标 " + row[0] + " 的证明压在账上";
      line.appendChild(head);
      const chip = document.createElement("span");
      chip.className = "chip warn";
      chip.textContent = "等收尾";
      line.appendChild(chip);
      parts.stage.appendChild(line);
    });
    parts.legend.textContent = "首轮验证 " + view.checked_first + " 份，二档 "
      + view.checked_wide + " 份，收尾前账 " + view.ledger_before + " 份，收尾补齐 "
      + view.catchup + " 份，收尾后账 " + view.ledger_after + " 份";
    parts.log.textContent = "工作计数 " + view.judged + " / 上界 " + view.judged_bound
      + "，重放新验证 " + view.replay_new + "，与全量对照差异 " + view.full_diff;
  }

  const budgetInput = document.createElement("input");
  budgetInput.type = "number";
  budgetInput.value = "2";
  parts.controls.appendChild(budgetInput);

  const runButton = document.createElement("button");
  runButton.className = "primary";
  runButton.textContent = "跑一遍";
  runButton.addEventListener("click", draw);
  parts.controls.appendChild(runButton);

  const budgetButton = document.createElement("button");
  budgetButton.textContent = "把验证预算换成输入框的值";
  budgetButton.addEventListener("click", function () {
    const next = Number(budgetInput.value);
    spec.budget = Number.isFinite(next) ? Math.max(1, Math.round(next)) : 1;
    draw();
  });
  parts.controls.appendChild(budgetButton);

  const dropButton = document.createElement("button");
  dropButton.textContent = "删最后一条事件";
  dropButton.addEventListener("click", function () {
    spec.events = (spec.events || []).slice(0, Math.max(0, (spec.events || []).length - 1));
    draw();
  });
  parts.controls.appendChild(dropButton);

  draw();
}
