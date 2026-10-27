import {
  calculateSize,
  formatMeasurement,
  inchesToCm,
} from "./sizing.js";

const STORAGE_KEY = "chijian-measurements-v1";
const RANGES = {
  underbust: { minCm: 55, maxCm: 150 },
  bust: { minCm: 60, maxCm: 160 },
};

const elements = {
  underbust: document.querySelector("#underbust"),
  bust: document.querySelector("#bust"),
  underbustRange: document.querySelector("#underbust-range"),
  bustRange: document.querySelector("#bust-range"),
  unitOptions: [...document.querySelectorAll("[data-unit]")],
  unitLabels: [...document.querySelectorAll("[data-unit-label]")],
  rangeLabels: [...document.querySelectorAll("[data-range-min], [data-range-max]")],
  formStatus: document.querySelector("#form-status"),
  calculateButton: document.querySelector("#calculate-button"),
  resultBand: document.querySelector("#result-band"),
  resultCup: document.querySelector("#result-cup"),
  resultSummary: document.querySelector("#result-summary"),
  sizeValue: document.querySelector(".size-value"),
  sizeCn: document.querySelector("#size-cn"),
  sizeEu: document.querySelector("#size-eu"),
  sizeUs: document.querySelector("#size-us"),
  sizeUk: document.querySelector("#size-uk"),
  differenceValue: document.querySelector("#difference-value"),
  cupMarker: document.querySelector("#cup-marker"),
  fitAdvice: document.querySelector("#fit-advice"),
  copyButton: document.querySelector("#copy-button"),
  toast: document.querySelector("#toast"),
  resultPanel: document.querySelector(".result-panel"),
};

let currentUnit = "cm";
let measurementsCm = {
  underbust: 75,
  bust: 90,
};
let currentResult = null;
let storageTimer = null;
let toastTimer = null;

function readStoredMeasurements() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || !Number.isFinite(stored.underbust) || !Number.isFinite(stored.bust)) {
      return;
    }

    if (stored.underbust >= 55 && stored.underbust <= 150) {
      measurementsCm.underbust = stored.underbust;
    }
    if (stored.bust >= 60 && stored.bust <= 160) {
      measurementsCm.bust = stored.bust;
    }
    if (stored.unit === "in" || stored.unit === "cm") {
      currentUnit = stored.unit;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function storeMeasurements() {
  window.clearTimeout(storageTimer);
  storageTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unit: currentUnit,
          underbust: measurementsCm.underbust,
          bust: measurementsCm.bust,
        }),
      );
    } catch {
      // Storage may be disabled in private browsing; measurement still works.
    }
  }, 180);
}

function displayValue(valueCm) {
  const value =
    currentUnit === "in" ? valueCm / 2.54 : valueCm;
  return Number(value.toFixed(1));
}

function setRangeProgress(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const progress = ((value - min) / (max - min)) * 100;
  input.style.setProperty("--range-progress", `${Math.max(0, Math.min(100, progress))}%`);
}

function syncSlider(field) {
  const rangeInput = elements[`${field}Range`];
  const value = displayValue(measurementsCm[field]);

  if (Number.isFinite(value)) {
    rangeInput.value = String(value);
  }
  setRangeProgress(rangeInput);
}

function configureInputsForUnit() {
  const isInches = currentUnit === "in";
  const step = isInches ? 0.1 : 0.5;

  elements.unitOptions.forEach((button) => {
    const active = button.dataset.unit === currentUnit;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  elements.unitLabels.forEach((label) => {
    label.textContent = currentUnit;
  });

  for (const [field, range] of Object.entries(RANGES)) {
    const numberInput = elements[field];
    const rangeInput = elements[`${field}Range`];
    const min = isInches ? Number((range.minCm / 2.54).toFixed(1)) : range.minCm;
    const max = isInches ? Number((range.maxCm / 2.54).toFixed(1)) : range.maxCm;

    numberInput.min = String(min);
    numberInput.max = String(max);
    numberInput.step = String(step);
    rangeInput.min = String(min);
    rangeInput.max = String(max);
    rangeInput.step = String(step);
  }

  const underbustMin = elements.underbustRange.min;
  const underbustMax = elements.underbustRange.max;
  const bustMin = elements.bustRange.min;
  const bustMax = elements.bustRange.max;
  const limits = elements.rangeLabels;

  limits[0].textContent = underbustMin;
  limits[1].textContent = underbustMax;
  limits[2].textContent = bustMin;
  limits[3].textContent = bustMax;
}

function renderInputValues() {
  for (const field of Object.keys(RANGES)) {
    const value = displayValue(measurementsCm[field]);
    elements[field].value = Number.isFinite(value) ? String(value) : "";
    syncSlider(field);
  }
}

function setFormStatus(text, highlight = "", isError = false) {
  elements.formStatus.classList.toggle("is-error", isError);
  elements.formStatus.replaceChildren();

  if (text) {
    elements.formStatus.append(document.createTextNode(text));
  }

  if (highlight) {
    const strong = document.createElement("strong");
    strong.textContent = highlight;
    elements.formStatus.append(strong);
  }
}

function clearResult(errorMessage) {
  currentResult = null;
  elements.resultBand.textContent = "—";
  elements.resultCup.textContent = "";
  elements.resultSummary.textContent = "请检查测量数值";
  elements.sizeValue.classList.add("is-invalid");
  elements.sizeCn.textContent = "—";
  elements.sizeEu.textContent = "—";
  elements.sizeUs.textContent = "—";
  elements.sizeUk.textContent = "—";
  elements.differenceValue.textContent = "—";
  elements.cupMarker.style.opacity = "0";
  elements.fitAdvice.textContent =
    "输入有效的下胸围和胸围后，这里会给出针对杯型的试穿提示。";
  setFormStatus(errorMessage, "", true);
  elements.copyButton.disabled = true;
}

function renderResult(result, errorMessage) {
  if (!result.valid) {
    const invalidFields = new Set(result.errors.map((error) => error.field));
    for (const field of Object.keys(RANGES)) {
      elements[field].setAttribute(
        "aria-invalid",
        String(invalidFields.has(field)),
      );
    }
    clearResult(errorMessage || result.errors[0]?.message);
    return;
  }

  currentResult = result;
  for (const field of Object.keys(RANGES)) {
    elements[field].removeAttribute("aria-invalid");
  }
  elements.resultBand.textContent = String(result.band);
  elements.resultCup.textContent = result.cup;
  elements.resultSummary.textContent =
    `下胸围 ${formatMeasurement(result.underbustCm, currentUnit)} ${currentUnit}` +
    ` · 胸围 ${formatMeasurement(result.bustCm, currentUnit)} ${currentUnit}`;
  elements.sizeValue.classList.remove("is-invalid");
  elements.sizeCn.textContent = result.sizes.cn;
  elements.sizeEu.textContent = result.sizes.eu;
  elements.sizeUs.textContent = result.sizes.us;
  elements.sizeUk.textContent = result.sizes.uk;
  elements.differenceValue.textContent =
    `${formatMeasurement(result.differenceCm, currentUnit)} ${currentUnit}`;
  elements.cupMarker.style.left = `${result.cupPosition}%`;
  elements.cupMarker.style.opacity = "1";
  elements.fitAdvice.textContent = result.fitAdvice;
  elements.copyButton.disabled = false;
  setFormStatus(
    "当前杯差 ",
    `${formatMeasurement(result.differenceCm, currentUnit)} ${currentUnit}`,
  );
}

function validateMeasurements() {
  const result = calculateSize({
    underbust: measurementsCm.underbust,
    bust: measurementsCm.bust,
  });
  renderResult(result);
  return result;
}

function updateInput(input, field) {
  const value = Number(input.value);
  if (input.value.trim() === "" || !Number.isFinite(value)) {
    measurementsCm[field] = Number.NaN;
  } else {
    measurementsCm[field] = currentUnit === "in" ? inchesToCm(value) : value;
  }
  syncSlider(field);
  validateMeasurements();
  storeMeasurements();
}

function handleUnitChange(nextUnit) {
  if (nextUnit === currentUnit) {
    return;
  }

  currentUnit = nextUnit;
  configureInputsForUnit();
  renderInputValues();
  validateMeasurements();
  storeMeasurements();
}

function openDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog && typeof dialog.showModal === "function") {
    dialog.showModal();
    document.documentElement.classList.add("modal-open");
  }
}

function closeDialog(dialog) {
  dialog.close();
  if (!document.querySelector("dialog[open]")) {
    document.documentElement.classList.remove("modal-open");
  }
}

function showToast(message) {
  elements.toast.querySelector("span").textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

async function copyResult() {
  if (!currentResult) {
    return;
  }

  const unit = currentUnit;
  const text =
    `我的参考尺码：${currentResult.sizes.cn}（CN）` +
    ` / ${currentResult.sizes.eu}（EU）` +
    ` / ${currentResult.sizes.us}（US）` +
    ` / ${currentResult.sizes.uk}（UK）；` +
    `下胸围 ${formatMeasurement(currentResult.underbustCm, unit)} ${unit}，` +
    `胸围 ${formatMeasurement(currentResult.bustCm, unit)} ${unit}，` +
    `杯差 ${formatMeasurement(currentResult.differenceCm, unit)} ${unit}。`;

  try {
    await navigator.clipboard.writeText(text);
    showToast("结果已复制");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    showToast(copied ? "结果已复制" : "复制失败，请手动选择");
  }
}

function handleCalculateClick() {
  const result = validateMeasurements();
  if (!result.valid) {
    const firstError = result.errors[0];
    elements[firstError.field]?.focus();
    return;
  }

  elements.calculateButton.classList.remove("is-pulsing");
  void elements.calculateButton.offsetWidth;
  elements.calculateButton.classList.add("is-pulsing");
  elements.resultPanel.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
}

elements.unitOptions.forEach((button) => {
  button.addEventListener("click", () => handleUnitChange(button.dataset.unit));
});

for (const field of Object.keys(RANGES)) {
  const numberInput = elements[field];
  const rangeInput = elements[`${field}Range`];

  numberInput.addEventListener("input", () => updateInput(numberInput, field));
  numberInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCalculateClick();
    }
  });
  rangeInput.addEventListener("input", () => {
    numberInput.value = rangeInput.value;
    updateInput(rangeInput, field);
  });
}

elements.calculateButton.addEventListener("click", handleCalculateClick);
elements.copyButton.addEventListener("click", copyResult);

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-dialog-open]");
  if (openButton) {
    openDialog(openButton.dataset.dialogOpen);
    return;
  }

  const closeButton = event.target.closest("[data-dialog-close]");
  if (closeButton) {
    const dialog = closeButton.closest("dialog");
    if (dialog) {
      closeDialog(dialog);
    }
  }
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog(dialog);
    }
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) {
      document.documentElement.classList.remove("modal-open");
    }
  });
});

readStoredMeasurements();
configureInputsForUnit();
renderInputValues();
validateMeasurements();
document.querySelector("#year").textContent = new Date().getFullYear();
