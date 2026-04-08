/* ============================================================
   UMSATZZIELE-APP.JS · Zuitable 2026
   ============================================================ */

const MONTHS_DE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const STORAGE_KEY = `sales-goals-${SALES_GOALS_CONFIG.year}`;

let selectedMonth = `${SALES_GOALS_CONFIG.year}-${String(new Date().getMonth() + 1).padStart(2,"0")}`;

document.addEventListener("DOMContentLoaded", () => {
  hydrateFromStorage();
  ensureAllMonthsExist();
  if (!SALES_GOALS_DATA[selectedMonth]) selectedMonth = `${SALES_GOALS_CONFIG.year}-01`;
  renderAll();
});

/* ---- Core ---- */
function renderAll() {
  renderProgressHero();
  renderSummary();
  renderTargets();
  renderMonthSwitch();
  renderEntryForm();
  renderBonusTable();
  renderWebshopBonus();
  updateTimestamp();
  updateHeaderBonus();
}

/* ---- Storage ---- */
function hydrateFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    Object.keys(parsed).forEach(month => {
      if (!SALES_GOALS_DATA[month]) SALES_GOALS_DATA[month] = {};
      Object.assign(SALES_GOALS_DATA[month], parsed[month]);
    });
  } catch(e) { console.warn("Storage fehler", e); }
}

function persistToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SALES_GOALS_DATA));
}

function ensureAllMonthsExist() {
  for (let i = 1; i <= 12; i++) {
    const k = `${SALES_GOALS_CONFIG.year}-${String(i).padStart(2,"0")}`;
    if (!SALES_GOALS_DATA[k]) SALES_GOALS_DATA[k] = {};
    SALES_GOALS_CONFIG.channels.forEach(ch => {
      if (typeof SALES_GOALS_DATA[k][ch.key] !== "number") SALES_GOALS_DATA[k][ch.key] = 0;
    });
  }
}

/* ---- Formatters ---- */
function formatCurrency(val) {
  return new Intl.NumberFormat("de-DE",{
    style:"currency", currency:"EUR",
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(val || 0);
}

function formatCurrencyCompact(val) {
  const abs = Math.abs(val || 0);
  const sign = val < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${(abs/1_000_000).toFixed(2)} Mio. €`;
  if (abs >= 1_000)     return `${sign}${(abs/1_000).toFixed(1)}T €`;
  return formatCurrency(val);
}

function formatPercent(val) {
  return `${(val || 0).toFixed(1)} %`;
}

function monthLabel(monthKey) {
  const m = Number(monthKey.slice(5,7));
  return `${MONTHS_DE[m-1]} ${String(SALES_GOALS_CONFIG.year).slice(2)}`;
}

/* ---- Calc helpers ---- */
function getChannelTotal(key) {
  return Object.values(SALES_GOALS_DATA).reduce((s,m) => s + Number(m[key] || 0), 0);
}

function getTotalActualForGoalChannels() {
  return SALES_GOALS_CONFIG.channels
    .filter(ch => ch.goal)
    .reduce((s,ch) => s + getChannelTotal(ch.key), 0);
}

function getTotalActualAllChannels() {
  return SALES_GOALS_CONFIG.channels.reduce((s,ch) => s + getChannelTotal(ch.key), 0);
}

function getOverallAchievementPct() {
  const goal = SALES_GOALS_CONFIG.totalGoal || 0;
  return goal ? (getTotalActualForGoalChannels() / goal) * 100 : 0;
}

function getCurrentBonus() {
  const pct = getOverallAchievementPct();
  let cur = SALES_GOALS_CONFIG.bonusSteps[0].bonus;
  SALES_GOALS_CONFIG.bonusSteps.forEach(s => { if (pct >= s.threshold) cur = s.bonus; });
  if (getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold) {
    cur += SALES_GOALS_CONFIG.webshopExtraBonus.bonus;
  }
  return cur;
}

function getNextBonusStep() {
  const pct = getOverallAchievementPct();
  return SALES_GOALS_CONFIG.bonusSteps.find(s => s.threshold > pct) || null;
}

function getRunRateProjection() {
  const curMonth = Math.max(1, Math.min(12, Number(selectedMonth.slice(5,7))));
  return (getTotalActualForGoalChannels() / curMonth) * 12;
}

function getStatusClass(ratio) {
  if (ratio >= 1)   return "good";
  if (ratio >= 0.7) return "neutral";
  return "bad";
}

function getStatusLabel(ratio) {
  if (ratio >= 1)   return "Ziel erreicht";
  if (ratio >= 0.7) return "Auf Kurs";
  return "Unter Plan";
}

function getBonusStepLabel(pct) {
  let label = SALES_GOALS_CONFIG.bonusSteps[0].label;
  SALES_GOALS_CONFIG.bonusSteps.forEach(s => { if (pct >= s.threshold) label = s.label; });
  return label;
}

/* ============================================================
   HERO PROGRESS BAR
   ============================================================ */
function renderProgressHero() {
  const container = document.getElementById("progress-hero");
  const totalGoal  = SALES_GOALS_CONFIG.totalGoal;
  const actual     = getTotalActualForGoalChannels();
  const pct        = getOverallAchievementPct();
  const gap        = actual - totalGoal;
  const maxPct     = 120; // bar spans 0–120%

  // Normalise current pct to bar width (capped at 100% of bar)
  const fillWidth  = Math.min(Math.max(pct / maxPct * 100, 0), 100);

  // Bonus milestones to show on bar
  const milestones = SALES_GOALS_CONFIG.bonusSteps.filter(s => s.threshold > 0);

  // Milestone marker HTML
  const milestonesHtml = milestones.map(step => {
    const pos = (step.threshold / maxPct) * 100;
    const isGoal = step.threshold === 100;
    const isPassed = pct >= step.threshold;
    const cls = isGoal ? "goal-marker" : (isPassed ? "bonus-active" : "");
    return `
      <div class="milestone-tick ${cls}" style="left:${pos}%">
        <div class="milestone-label">${step.label}</div>
        <div class="milestone-line"></div>
      </div>
    `;
  }).join("");

  // Track overlay markers (colored lines on the bar track itself)
  const trackMarkersHtml = milestones.map(step => {
    const pos = (step.threshold / maxPct) * 100;
    const isGoal = step.threshold === 100;
    const color = isGoal ? "var(--green)" : "rgba(255,255,255,0.5)";
    return `<div class="track-marker" style="left:${pos}%;background:${color};opacity:0.8;"></div>`;
  }).join("");

  // Bottom labels
  const labelsHtml = milestones.map(step => {
    const pos = (step.threshold / maxPct) * 100;
    const isGoal = step.threshold === 100;
    return `
      <div class="track-label ${isGoal?"goal-label":""}" style="left:${pos}%">
        ${isGoal ? formatCurrencyCompact(totalGoal) : `${step.threshold}%`}
      </div>
    `;
  }).join("");

  // Next bonus step
  const next = getNextBonusStep();
  const nextHtml = next
    ? `Nächste Stufe: <strong>${next.label}</strong> → <strong>${formatCurrency(next.bonus)}</strong> Bonus`
    : `<strong>Höchste Bonusstufe erreicht 🎉</strong>`;

  container.innerHTML = `
    <div class="progress-hero-top">
      <div>
        <div class="progress-big-number">${formatCurrency(actual)}</div>
        <div class="progress-big-label">Ist-Umsatz · Kanäle mit Jahresziel</div>
      </div>
      <div class="progress-pct-badge">${formatPercent(pct)} erreicht</div>
      <div class="progress-gap-info">
        <div class="progress-gap-value">${gap < 0 ? formatCurrencyCompact(Math.abs(gap)) : "✓"}</div>
        <div class="progress-gap-label">${gap < 0 ? "noch zum Jahresziel" : "Jahresziel überschritten"}</div>
      </div>
    </div>

    <div class="progress-track-wrap">
      <div class="progress-milestones">${milestonesHtml}</div>
      <div class="progress-track">
        ${trackMarkersHtml}
        <div class="progress-fill" style="width:${fillWidth}%"></div>
      </div>
      <div class="progress-track-labels">
        <div class="track-label" style="left:0%;transform:none;">0 €</div>
        ${labelsHtml}
      </div>
    </div>

    <div class="progress-next-bonus" style="text-align:center;font-size:0.78rem;color:var(--gray-500);margin-top:0.25rem;margin-bottom:0.5rem;">
      ${nextHtml}
    </div>

    <div class="progress-stats-row">
      <div class="progress-stat">
        <div class="progress-stat-value">${formatCurrency(totalGoal)}</div>
        <div class="progress-stat-label">Jahresziel</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-value">${formatCurrencyCompact(getRunRateProjection())}</div>
        <div class="progress-stat-label">Run-Rate Prognose</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-value">${formatCurrency(getCurrentBonus())}</div>
        <div class="progress-stat-label">Aktueller Bonus</div>
      </div>
      <div class="progress-stat">
        <div class="progress-stat-value">${formatCurrencyCompact(getTotalActualAllChannels())}</div>
        <div class="progress-stat-label">Alle Kanäle gesamt</div>
      </div>
    </div>
  `;
}

/* ============================================================
   KPI SUMMARY CARDS
   ============================================================ */
function renderSummary() {
  const container    = document.getElementById("goal-summary-grid");
  const totalActual  = getTotalActualForGoalChannels();
  const totalGoal    = SALES_GOALS_CONFIG.totalGoal;
  const overallPct   = getOverallAchievementPct();
  const bonus        = getCurrentBonus();
  const projection   = getRunRateProjection();

  const cards = [
    {
      label: "Ist-Umsatz vs. Jahresziel",
      value: formatCurrency(totalActual),
      desc: `von ${formatCurrency(totalGoal)} · ${formatPercent(overallPct)} erreicht`,
      progress: Math.min(overallPct, 100),
      metaLeft: "Zielerreichung", metaLeftVal: formatPercent(overallPct),
      metaRight: "Gap zum Ziel",  metaRightVal: formatCurrency(totalActual - totalGoal)
    },
    {
      label: "Aktueller Bonusanspruch",
      value: formatCurrency(bonus),
      desc: `Bonusstufe: ${getBonusStepLabel(overallPct)}`,
      progress: Math.min(overallPct / 1.2, 100),
      metaLeft: "Aktive Stufe",  metaLeftVal: getBonusStepLabel(overallPct),
      metaRight: "Webshop Extra", metaRightVal: getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold ? "Aktiv ✓" : "Noch offen"
    },
    {
      label: "Jahreshochrechnung (Run-Rate)",
      value: formatCurrencyCompact(projection),
      desc: "Forecast auf Basis aktueller Durchschnitte",
      progress: Math.min((projection / totalGoal) * 100, 100),
      metaLeft: "Forecast vs. Ziel", metaLeftVal: formatPercent((projection / totalGoal) * 100),
      metaRight: "Forecast Delta",   metaRightVal: formatCurrencyCompact(projection - totalGoal)
    }
  ];

  container.innerHTML = cards.map(c => `
    <div class="goal-card">
      <div class="kpi-label">${c.label}</div>
      <div class="big-focus">${c.value}</div>
      <div class="kpi-desc">${c.desc}</div>
      <div class="goal-bar-wrap">
        <div class="goal-bar" style="width:${Math.max(0,Math.min(c.progress,100))}%"></div>
      </div>
      <div class="goal-mini">
        <span>${c.metaLeft}: <strong>${c.metaLeftVal}</strong></span>
        <span>${c.metaRight}: <strong>${c.metaRightVal}</strong></span>
      </div>
    </div>
  `).join("");
}

/* ============================================================
   CHANNEL TARGETS
   ============================================================ */
function renderTargets() {
  const container = document.getElementById("targets-grid");

  container.innerHTML = SALES_GOALS_CONFIG.channels.map(ch => {
    const actual   = getChannelTotal(ch.key);
    const goal     = ch.goal;
    const ratio    = goal ? actual / goal : 0;
    const progress = goal ? Math.min(ratio * 100, 100) : 0;
    const delta    = goal ? actual - goal : null;
    const sc       = goal ? getStatusClass(ratio) : "";
    const sl       = goal ? getStatusLabel(ratio) : "Kein Ziel";

    return `
      <div class="target-card">
        <div class="target-head">
          <div class="target-title">${ch.label}</div>
          <div class="target-status ${sc}">${sl}</div>
        </div>
        <div class="target-value">${formatCurrency(actual)}</div>
        <div class="target-sub">${goal ? `Jahresziel: ${formatCurrency(goal)}` : "Kein Ziel hinterlegt"}</div>
        <div class="target-progress">
          <span style="width:${progress}%"></span>
        </div>
        <div class="target-meta">
          <div class="target-meta-box">
            <span class="target-meta-label">Zielerreichung</span>
            <span class="target-meta-value">${goal ? formatPercent(ratio * 100) : "–"}</span>
          </div>
          <div class="target-meta-box">
            <span class="target-meta-label">Delta</span>
            <span class="target-meta-value">${goal ? formatCurrency(delta) : "–"}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* ============================================================
   MONTH SWITCH
   ============================================================ */
function renderMonthSwitch() {
  const container = document.getElementById("month-switch");
  container.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const k = `${SALES_GOALS_CONFIG.year}-${String(i).padStart(2,"0")}`;
    const btn = document.createElement("button");
    btn.className = "month-btn" + (k === selectedMonth ? " active" : "");
    btn.textContent = monthLabel(k);
    btn.onclick = () => { selectedMonth = k; renderMonthSwitch(); renderEntryForm(); };
    container.appendChild(btn);
  }
}

/* ============================================================
   ENTRY FORM
   ============================================================ */
function renderEntryForm() {
  const container = document.getElementById("goal-entry-grid");
  const monthData = SALES_GOALS_DATA[selectedMonth] || {};

  container.innerHTML = SALES_GOALS_CONFIG.channels.map(ch => `
    <div class="entry-field">
      <label for="field-${ch.key}">${ch.label}</label>
      <input
        id="field-${ch.key}"
        type="number"
        step="0.01"
        value="${Number(monthData[ch.key] || 0)}"
        placeholder="0.00"
      />
      <div class="hint">${monthLabel(selectedMonth)} · ${ch.goal ? `Ziel ${formatCurrency(ch.goal)}` : "kein Ziel"}</div>
    </div>
  `).join("");
}

function saveMonthData() {
  if (!SALES_GOALS_DATA[selectedMonth]) SALES_GOALS_DATA[selectedMonth] = {};
  SALES_GOALS_CONFIG.channels.forEach(ch => {
    const input = document.getElementById(`field-${ch.key}`);
    const val = parseFloat((input.value || "0").replace(",","."));
    SALES_GOALS_DATA[selectedMonth][ch.key] = Number.isFinite(val) ? val : 0;
  });
  persistToStorage();
  renderAll();
  showToast(`✓ Monatswerte für ${monthLabel(selectedMonth)} gespeichert`);
}

function resetSelectedMonth() {
  SALES_GOALS_CONFIG.channels.forEach(ch => { SALES_GOALS_DATA[selectedMonth][ch.key] = 0; });
  persistToStorage();
  renderAll();
  showToast(`Monatswerte für ${monthLabel(selectedMonth)} zurückgesetzt`);
}

/* ============================================================
   BONUS TABLE
   ============================================================ */
function renderBonusTable() {
  const tbody      = document.getElementById("bonus-table-body");
  const currentPct = getOverallAchievementPct();

  // Find the "current" active step (highest passed)
  let currentStepIdx = 0;
  SALES_GOALS_CONFIG.bonusSteps.forEach((s,i) => { if (currentPct >= s.threshold) currentStepIdx = i; });

  tbody.innerHTML = SALES_GOALS_CONFIG.bonusSteps.map((step, i) => {
    const passed  = currentPct >= step.threshold;
    const isCur   = i === currentStepIdx;
    const rowCls  = isCur ? "current-step" : "";
    const dotCls  = isCur ? "current" : (passed ? "active" : "");
    const badge   = `<span class="bonus-step-badge"><span class="bonus-dot ${dotCls}"></span>${step.label}</span>`;
    const statusStr = isCur ? "← Aktuell" : (passed ? "Erreicht ✓" : "");
    return `
      <tr class="${rowCls}">
        <td>${badge}</td>
        <td>${formatCurrency(step.bonus)}</td>
        <td style="font-size:0.72rem;color:var(--gray-400);">${statusStr}</td>
      </tr>
    `;
  }).join("") + `
    <tr class="${getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold ? "active-row" : ""}">
      <td>Zuitable.com &gt; ${formatCurrencyCompact(SALES_GOALS_CONFIG.webshopExtraBonus.threshold)}</td>
      <td>+ ${formatCurrency(SALES_GOALS_CONFIG.webshopExtraBonus.bonus)}</td>
      <td style="font-size:0.72rem;">${getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold ? "Aktiv ✓" : "Noch offen"}</td>
    </tr>
    <tr style="border-top:2px solid rgba(17,17,17,0.1);">
      <td><strong>Gesamtbonus aktuell</strong></td>
      <td><strong style="font-family:var(--font-mono);">${formatCurrency(getCurrentBonus())}</strong></td>
      <td></td>
    </tr>
  `;
}

function renderWebshopBonus() {
  const container  = document.getElementById("bonus-webshop-progress");
  const threshold  = SALES_GOALS_CONFIG.webshopExtraBonus.threshold;
  const actual     = getChannelTotal("zuitable");
  const pct        = Math.min((actual / threshold) * 100, 100);
  const gap        = actual - threshold;

  container.innerHTML = `
    <div class="bonus-ws-label">
      <span>Zuitable.com Umsatz</span>
      <span style="color:rgba(255,255,255,0.75);font-family:var(--font-mono);">${formatCurrency(actual)}</span>
    </div>
    <div class="bonus-ws-track">
      <div class="bonus-ws-fill" style="width:${pct}%"></div>
    </div>
    <div class="bonus-ws-value">
      ${gap < 0 ? `Noch ${formatCurrency(Math.abs(gap))} bis zum Extra-Bonus` : "Extra-Bonus aktiv ✓"}
    </div>
  `;
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function toggleEntryPanel() {
  const body   = document.getElementById("entry-body");
  const toggle = document.getElementById("entry-toggle");
  body.classList.toggle("open");
  toggle.classList.toggle("open");
}

function openExportBox() {
  document.getElementById("export-box").classList.add("open");
  document.getElementById("export-output").textContent = buildExportString();
}

function buildExportString() {
  return `const SALES_GOALS_DATA = ${JSON.stringify(SALES_GOALS_DATA, null, 2)};`;
}

function copyExport() {
  navigator.clipboard.writeText(buildExportString())
    .then(()  => showToast("Export kopiert"))
    .catch(()  => showToast("Kopieren fehlgeschlagen"));
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

function updateTimestamp() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  const now = new Date();
  el.textContent = `Stand ${now.toLocaleDateString("de-DE")} · ${now.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`;
}

function updateHeaderBonus() {
  const el = document.getElementById("header-bonus-value");
  if (el) el.textContent = formatCurrency(getCurrentBonus());
}
