/* NPTEL Self-Test: logic
   - Each question: pick an option, press Submit (checks answer), or Reset (clears it).
   - 1 mark per correct answer, 120 marks total, pass mark = 40.
*/
const PASS_MARK = 40;
const LABELS = ["a", "b", "c", "d"];

// state[week][index] = { picked: number|null, submitted: boolean }
const state = {};
QUIZ_DATA.forEach(w => {
  state[w.week] = w.questions.map(() => ({ picked: null, submitted: false }));
});
const TOTAL = QUIZ_DATA.reduce((n, w) => n + w.questions.length, 0);

const quizEl = document.getElementById("quiz");
const tabsEl = document.getElementById("weekTabs");
const resultEl = document.getElementById("resultPanel");
let currentWeek = "all";

/* ---------- build the page ---------- */
function buildTabs() {
  const mk = (label, val) => {
    const b = document.createElement("button");
    b.className = "tab" + (val === currentWeek ? " active" : "");
    b.textContent = label;
    b.onclick = () => { currentWeek = val; buildTabs(); render(); window.scrollTo(0, 0); };
    tabsEl.appendChild(b);
  };
  tabsEl.innerHTML = "";
  mk("All weeks", "all");
  QUIZ_DATA.forEach(w => mk("Week " + w.week, w.week));
}

function render() {
  quizEl.innerHTML = "";
  QUIZ_DATA.filter(w => currentWeek === "all" || w.week === currentWeek).forEach(w => {
    const h = document.createElement("h2");
    h.className = "week-title";
    h.innerHTML = `Week ${w.week}<small id="wk-score-${w.week}"></small>`;
    quizEl.appendChild(h);
    w.questions.forEach((q, i) => quizEl.appendChild(buildCard(w.week, i, q)));
    updateWeekScore(w.week);
  });
  updateLive();
}

function buildCard(week, i, q) {
  const s = state[week][i];
  const card = document.createElement("div");
  card.className = "card" + (s.submitted ? " locked" : "");
  card.id = `q-${week}-${i}`;

  const p = document.createElement("p");
  p.className = "qtext";
  p.innerHTML = `<span class="qnum">${i + 1}.</span>`;
  p.appendChild(document.createTextNode(q.q));
  card.appendChild(p);

  q.options.forEach((text, k) => {
    const row = document.createElement("label");
    row.className = "opt";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `r-${week}-${i}`;
    input.checked = s.picked === k;
    input.disabled = s.submitted;
    input.onchange = () => { s.picked = k; refreshCard(week, i, q); };
    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = `(${LABELS[k]})`;
    const t = document.createElement("span");
    t.textContent = text;
    row.append(input, lab, t);
    card.appendChild(row);
  });

  const foot = document.createElement("div");
  foot.className = "qfoot";
  const submit = document.createElement("button");
  submit.className = "btn primary"; submit.textContent = "Submit";
  submit.onclick = () => submitQuestion(week, i, q);
  const reset = document.createElement("button");
  reset.className = "btn"; reset.textContent = "Reset";
  reset.onclick = () => resetQuestion(week, i, q);
  const msg = document.createElement("span");
  msg.className = "msg";
  foot.append(submit, reset, msg);
  card.appendChild(foot);

  paintCard(card, s, q);
  return card;
}

/* ---------- per-question actions ---------- */
function submitQuestion(week, i, q) {
  const s = state[week][i];
  const card = document.getElementById(`q-${week}-${i}`);
  if (s.picked === null) {
    const m = card.querySelector(".msg");
    m.className = "msg warn"; m.textContent = "Select an option first.";
    return;
  }
  s.submitted = true;
  refreshCard(week, i, q);
}

function resetQuestion(week, i, q) {
  const s = state[week][i];
  s.picked = null; s.submitted = false;
  refreshCard(week, i, q);
}

function refreshCard(week, i, q) {
  const old = document.getElementById(`q-${week}-${i}`);
  old.replaceWith(buildCard(week, i, q));
  updateWeekScore(week);
  updateLive();
  if (!resultEl.classList.contains("hidden")) showResult(); // keep result in sync
}

/* ---------- colours: green = correct, red = wrong ---------- */
function paintCard(card, s, q) {
  const rows = card.querySelectorAll(".opt");
  const msg = card.querySelector(".msg");
  const [submit, reset] = card.querySelectorAll(".qfoot .btn");
  rows.forEach(r => r.classList.remove("picked", "correct", "wrong"));
  if (!s.submitted) {
    if (s.picked !== null) rows[s.picked].classList.add("picked");
    submit.disabled = false;
    reset.disabled = s.picked === null;
    msg.textContent = ""; msg.className = "msg";
    return;
  }
  submit.disabled = true;
  rows[q.answer].classList.add("correct");           // always show the right answer in green
  if (s.picked === q.answer) {
    msg.className = "msg ok"; msg.textContent = "Correct (+1 mark)";
  } else {
    rows[s.picked].classList.add("wrong");           // chosen wrong option in red
    msg.className = "msg bad"; msg.textContent = "Wrong (0 marks)";
  }
}

/* ---------- scoring ---------- */
function weekStats(week) {
  const qs = QUIZ_DATA.find(w => w.week === week).questions;
  let submitted = 0, correct = 0;
  state[week].forEach((s, i) => {
    if (s.submitted) { submitted++; if (s.picked === qs[i].answer) correct++; }
  });
  return { submitted, correct, total: qs.length };
}
function overall() {
  let submitted = 0, correct = 0;
  QUIZ_DATA.forEach(w => { const r = weekStats(w.week); submitted += r.submitted; correct += r.correct; });
  return { submitted, correct };
}
function updateWeekScore(week) {
  const el = document.getElementById(`wk-score-${week}`);
  if (!el) return;
  const r = weekStats(week);
  el.textContent = r.submitted ? `${r.correct}/${r.total} correct` : "";
}
function updateLive() {
  const o = overall();
  document.getElementById("liveScore").textContent = o.correct;
  document.getElementById("liveAnswered").textContent = o.submitted;
}

function showResult() {
  const o = overall();
  const passed = o.correct >= PASS_MARK;
  let rows = "";
  QUIZ_DATA.forEach(w => {
    const r = weekStats(w.week);
    rows += `<tr><td>Week ${w.week}</td><td>${r.correct} / ${r.total}</td><td>${r.submitted}</td></tr>`;
  });
  resultEl.className = "result " + (passed ? "pass" : "fail");
  resultEl.innerHTML = `
    <h2>${passed ? "PASS" : "FAIL"}</h2>
    <div class="big">${o.correct} / ${TOTAL} marks</div>
    <p>1 mark per correct answer. Pass mark: ${PASS_MARK}.
       ${passed ? "You have reached the pass mark." : `You need ${PASS_MARK - o.correct} more correct answer(s) to pass.`}<br>
       Submitted: ${o.submitted} of ${TOTAL}. Not submitted: ${TOTAL - o.submitted}.</p>
    <table><tr><th>Week</th><th>Correct</th><th>Submitted</th></tr>${rows}</table>`;
  resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- top buttons ---------- */
document.getElementById("resultBtn").onclick = showResult;
document.getElementById("resetAllBtn").onclick = () => {
  if (!confirm("Reset every question in all 12 weeks?")) return;
  Object.values(state).forEach(arr => arr.forEach(s => { s.picked = null; s.submitted = false; }));
  resultEl.className = "result hidden"; resultEl.innerHTML = "";
  render();
};

buildTabs();
render();
