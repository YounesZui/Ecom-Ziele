const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const STORAGE_KEY = `sales-goals-${SALES_GOALS_CONFIG.year}`;
let selectedMonth = `${SALES_GOALS_CONFIG.year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

document.addEventListener("DOMContentLoaded", () => {
  hydrateFromStorage();
  ensureAllMonthsExist();
  if (!SALES_GOALS_DATA[selectedMonth]) selectedMonth = `${SALES_GOALS_CONFIG.year}-01`;
  renderAll();
});

function renderAll() {
  renderSummary();
  renderTargets();
  renderMonthSwitch();
  renderEntryForm();
  renderBonusTable();
  updateTimestamp();
}

function hydrateFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    Object.keys(parsed).forEach(month => {
      if (!SALES_GOALS_DATA[month]) SALES_GOALS_DATA[month] = {};
      Object.assign(SALES_GOALS_DATA[month], parsed[month]);
    });
  } catch (e) {
    console.warn("Storage konnte nicht geladen werden", e);
  }
}

function persistToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SALES_GOALS_DATA));
}

function ensureAllMonthsExist() {
  for (let i = 1; i <= 12; i++) {
    const monthKey = `${SALES_GOALS_CONFIG.year}-${String(i).padStart(2, "0")}`;
    if (!SALES_GOALS_DATA[monthKey]) SALES_GOALS_DATA[monthKey] = {};
    SALES_GOALS_CONFIG.channels.forEach(ch => {
      if (typeof SALES_GOALS_DATA[monthKey][ch.key] !== "number") SALES_GOALS_DATA[monthKey][ch.key] = 0;
    });
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
}

function formatPercent(val) {
  return `${(val || 0).toFixed(1)}%`;
}

function monthLabel(monthKey) {
  const month = Number(monthKey.slice(5, 7));
  return `${MONTHS_DE[month - 1]} ${String(SALES_GOALS_CONFIG.year).slice(2)}`;
}

function getChannelTotal(channelKey) {
  return Object.values(SALES_GOALS_DATA).reduce((sum, monthObj) => sum + Number(monthObj[channelKey] || 0), 0);
}

function getTrackedGoalSum() {
  return SALES_GOALS_CONFIG.channels.reduce((sum, ch) => sum + (ch.goal || 0), 0);
}

function getTotalActualForGoalChannels() {
  return SALES_GOALS_CONFIG.channels.reduce((sum, ch) => {
    if (!ch.goal) return sum;
    return sum + getChannelTotal(ch.key);
  }, 0);
}

function getTotalActualAllChannels() {
  return SALES_GOALS_CONFIG.channels.reduce((sum, ch) => sum + getChannelTotal(ch.key), 0);
}

function getOverallAchievementPct() {
  const goal = SALES_GOALS_CONFIG.totalGoal || 0;
  if (!goal) return 0;
  return (getTotalActualForGoalChannels() / goal) * 100;
}

function getCurrentBonus() {
  const pct = getOverallAchievementPct();
  let current = SALES_GOALS_CONFIG.bonusSteps[0].bonus;

  SALES_GOALS_CONFIG.bonusSteps.forEach(step => {
    if (pct >= step.threshold) current = step.bonus;
  });

  const webshopTotal = getChannelTotal("zuitable");
  if (webshopTotal > SALES_GOALS_CONFIG.webshopExtraBonus.threshold) {
    current += SALES_GOALS_CONFIG.webshopExtraBonus.bonus;
  }

  return current;
}

function getRunRateProjection() {
  const currentMonth = Math.max(1, Math.min(12, Number(selectedMonth.slice(5, 7))));
  const actual = getTotalActualForGoalChannels();
  return (actual / currentMonth) * 12;
}

function getStatusClass(ratio) {
  if (ratio >= 1) return "good";
  if (ratio >= 0.7) return "neutral";
  return "bad";
}

function getStatusLabel(ratio) {
  if (ratio >= 1) return "Ziel erreicht";
  if (ratio >= 0.7) return "Auf Kurs";
  return "Unter Plan";
}

function renderSummary() {
  const container = document.getElementById("goal-summary-grid");
  const totalActual = getTotalActualForGoalChannels();
  const totalGoal = SALES_GOALS_CONFIG.totalGoal;
  const overallPct = getOverallAchievementPct();
  const bonus = getCurrentBonus();
  const projection = getRunRateProjection();

  const cards = [
    {
      label: "Gesamtumsatz vs. Ziel",
      value: formatCurrency(totalActual),
      sub: `von ${formatCurrency(totalGoal)}`,
      progress: Math.min(overallPct, 100),
      metaLeft: "Zielerreichung",
      metaLeftValue: formatPercent(overallPct),
      metaRight: "Delta",
      metaRightValue: formatCurrency(totalActual - totalGoal)
    },
    {
      label: "Aktueller Bonus",
      value: formatCurrency(bonus),
      sub: "gemäß Staffelung",
      progress: Math.min(overallPct, 120) / 1.2,
      metaLeft: "Bonusstufe",
      metaLeftValue: getBonusStepLabel(overallPct),
      metaRight: "Webshop Extra",
      metaRightValue: getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold ? "Aktiv" : "Offen"
    },
    {
      label: "Hochrechnung",
      value: formatCurrency(projection),
      sub: "Run-Rate auf Jahresbasis",
      progress: Math.min((projection / totalGoal) * 100, 100),
      metaLeft: "gegen Ziel",
      metaLeftValue: formatPercent((projection / totalGoal) * 100),
      metaRight: "Forecast Delta",
      metaRightValue: formatCurrency(projection - totalGoal)
    }
  ];

  container.innerHTML = cards.map(card => `
    <div class="goal-card">
      <div class="kpi-label">${card.label}</div>
      <div class="big-focus" style="margin-top:.5rem;">${card.value}</div>
      <div class="kpi-desc" style="margin-top:.4rem;">${card.sub}</div>
      <div class="goal-bar-wrap">
        <div class="goal-bar" style="width:${Math.max(0, Math.min(card.progress, 100))}%"></div>
      </div>
      <div class="goal-mini">
        <span>${card.metaLeft}: <strong>${card.metaLeftValue}</strong></span>
        <span>${card.metaRight}: <strong>${card.metaRightValue}</strong></span>
      </div>
    </div>
  `).join("");
}

function renderTargets() {
  const container = document.getElementById("targets-grid");

  container.innerHTML = SALES_GOALS_CONFIG.channels.map(ch => {
    const actual = getChannelTotal(ch.key);
    const goal = ch.goal;
    const ratio = goal ? actual / goal : 0;
    const progress = goal ? Math.min(ratio * 100, 100) : 0;
    const delta = goal ? actual - goal : null;
    const statusClass = goal ? getStatusClass(ratio) : "";
    const statusLabel = goal ? getStatusLabel(ratio) : "Kein Ziel hinterlegt";

    return `
      <div class="target-card">
        <div class="target-head">
          <div class="target-title">${ch.label}</div>
          <div class="target-status ${statusClass}">${statusLabel}</div>
        </div>

        <div class="target-value">${formatCurrency(actual)}</div>
        <div class="target-sub">
          ${goal ? `Ziel: ${formatCurrency(goal)}` : `Aktuell ohne definiertes Ziel`}
        </div>

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

function renderMonthSwitch() {
  const container = document.getElementById("month-switch");
  container.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const monthKey = `${SALES_GOALS_CONFIG.year}-${String(i).padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.className = "month-btn" + (monthKey === selectedMonth ? " active" : "");
    btn.textContent = monthLabel(monthKey);
    btn.onclick = () => {
      selectedMonth = monthKey;
      renderMonthSwitch();
      renderEntryForm();
    };
    container.appendChild(btn);
  }
}

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
      <div class="hint">
        ${monthLabel(selectedMonth)} · ${ch.goal ? `Jahresziel ${formatCurrency(ch.goal)}` : `ohne Jahresziel`}
      </div>
    </div>
  `).join("");
}

function saveMonthData() {
  if (!SALES_GOALS_DATA[selectedMonth]) SALES_GOALS_DATA[selectedMonth] = {};

  SALES_GOALS_CONFIG.channels.forEach(ch => {
    const input = document.getElementById(`field-${ch.key}`);
    const val = parseFloat((input.value || "0").replace(",", "."));
    SALES_GOALS_DATA[selectedMonth][ch.key] = Number.isFinite(val) ? val : 0;
  });

  persistToStorage();
  renderAll();
  showToast(`Monatswerte für ${monthLabel(selectedMonth)} gespeichert`);
}

function resetSelectedMonth() {
  SALES_GOALS_CONFIG.channels.forEach(ch => {
    SALES_GOALS_DATA[selectedMonth][ch.key] = 0;
  });
  persistToStorage();
  renderAll();
  showToast(`Monatswerte für ${monthLabel(selectedMonth)} zurückgesetzt`);
}

function renderBonusTable() {
  const tbody = document.getElementById("bonus-table-body");
  const currentPct = getOverallAchievementPct();
  const currentBonus = getCurrentBonus();

  tbody.innerHTML = SALES_GOALS_CONFIG.bonusSteps.map(step => {
    const active = currentPct >= step.threshold;
    return `
      <tr class="${active ? "active-row" : ""}">
        <td>${step.label}</td>
        <td>${formatCurrency(step.bonus)}</td>
      </tr>
    `;
  }).join("") + `
    <tr class="${getChannelTotal("zuitable") > SALES_GOALS_CONFIG.webshopExtraBonus.threshold ? "active-row" : ""}">
      <td>Zuitable.com > ${formatCurrency(SALES_GOALS_CONFIG.webshopExtraBonus.threshold)}</td>
      <td>+ ${formatCurrency(SALES_GOALS_CONFIG.webshopExtraBonus.bonus)}</td>
    </tr>
    <tr class="active-row">
      <td><strong>Aktuell relevanter Bonus</strong></td>
      <td><strong>${formatCurrency(currentBonus)}</strong></td>
    </tr>
  `;
}

function getBonusStepLabel(pct) {
  let label = SALES_GOALS_CONFIG.bonusSteps[0].label;
  SALES_GOALS_CONFIG.bonusSteps.forEach(step => {
    if (pct >= step.threshold) label = step.label;
  });
  return label;
}

function toggleEntryPanel() {
  const body = document.getElementById("entry-body");
  const toggle = document.getElementById("entry-toggle");
  body.classList.toggle("open");
  toggle.classList.toggle("open");
}

function openExportBox() {
  const box = document.getElementById("export-box");
  const output = document.getElementById("export-output");
  box.classList.add("open");
  output.textContent = buildExportString();
}

function buildExportString() {
  return `const SALES_GOALS_DATA = ${JSON.stringify(SALES_GOALS_DATA, null, 2)};`;
}

function copyExport() {
  const text = buildExportString();
  navigator.clipboard.writeText(text).then(() => {
    showToast("Export in die Zwischenablage kopiert");
  }).catch(() => {
    showToast("Kopieren fehlgeschlagen");
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function updateTimestamp() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  const now = new Date();
  el.textContent = `Letztes Update · ${now.toLocaleDateString("de-DE")} · ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
}
