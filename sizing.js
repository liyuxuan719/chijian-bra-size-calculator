export const CM_PER_INCH = 2.54;

export const CUP_STEP_CM = 2.5;

const CN_CUPS = [
  "AA",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

const US_CUPS = [
  "AA",
  "A",
  "B",
  "C",
  "D",
  "DD/E",
  "DDD/F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

const UK_CUPS = [
  "AA",
  "A",
  "B",
  "C",
  "D",
  "DD",
  "E",
  "F",
  "FF",
  "G",
  "GG",
  "H",
  "HH",
  "J",
];

const CUP_FIT_ADVICE = {
  AA: "杯差较小，可优先试穿 AA 或 A 杯。若杯口压胸、底围上滑，优先调整底围而不是继续加大杯型。",
  A: "试试 A 杯及相邻底围。底围能稳定贴合、杯口不压胸，通常比单纯追求尺码数字更重要。",
  B: "试试 B 杯及相邻底围。抬手检查底围是否上滑，并确认杯沿没有压入胸部。",
  C: "杯型与底围贴合即可。不同品牌的版型通常会有约 1 个尺码的偏差。",
  D: "建议同时试穿 D 杯和相邻底围。关注杯口是否浮起，以及钢圈是否落在胸部外侧而非压在组织上。",
  E: "建议优先比较 E 杯与相邻底围。肩带可调，但底围应承担主要支撑力。",
  F: "建议试穿 F 杯及同杯不同底围版本。确认中心位平贴、杯体没有明显上移。",
  G: "大杯型更需要关注底围稳定性。试穿时检查杯口、侧比和肩带是否均匀承载。",
};

function roundToOne(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function toFiniteNumber(value) {
  if (typeof value === "string" && value.trim() === "") {
    return Number.NaN;
  }
  return Number(value);
}

export function cmToInches(value) {
  return value / CM_PER_INCH;
}

export function inchesToCm(value) {
  return value * CM_PER_INCH;
}

export function formatMeasurement(value, unit = "cm") {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const converted = unit === "in" ? cmToInches(value) : value;
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: converted % 1 === 0 ? 0 : 1,
  }).format(converted);
}

export function getCupByDifference(differenceCm) {
  const difference = roundToOne(differenceCm);
  const offset = Math.ceil((difference - 7.5) / CUP_STEP_CM);
  const cupIndex = Math.max(0, Math.min(CN_CUPS.length - 1, offset));

  return {
    label: CN_CUPS[cupIndex],
    index: cupIndex,
  };
}

export function getReferenceSizes(band, cupIndex) {
  const usBand = 32 + ((band - 70) / 5) * 2;
  const ukBand = usBand;
  const safeCupIndex = Math.max(0, Math.min(CN_CUPS.length - 1, cupIndex));
  const usCup = US_CUPS[safeCupIndex] ?? CN_CUPS[safeCupIndex];
  const ukCup =
    UK_CUPS[Math.min(safeCupIndex, UK_CUPS.length - 1)] ??
    CN_CUPS[safeCupIndex];
  const cnCup = CN_CUPS[safeCupIndex];

  return {
    cn: `${band}${cnCup}`,
    eu: `${band}${cnCup}`,
    us: `${usBand}${usCup}`,
    uk: `${ukBand}${ukCup}`,
  };
}

export function getFitAdvice(cupLabel) {
  return (
    CUP_FIT_ADVICE[cupLabel] ??
    "建议同时试穿计算结果及相邻尺码，以底围稳定、杯口贴合和肩带舒适作为最终判断。"
  );
}

export function calculateSize({
  underbust,
  bust,
  unit = "cm",
  strictRange = true,
}) {
  const rawUnderbust = toFiniteNumber(underbust);
  const rawBust = toFiniteNumber(bust);
  const errors = [];

  if (!Number.isFinite(rawUnderbust)) {
    errors.push({ field: "underbust", message: "请输入有效的下胸围。" });
  }
  if (!Number.isFinite(rawBust)) {
    errors.push({ field: "bust", message: "请输入有效的胸围。" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const underbustCm = unit === "in" ? inchesToCm(rawUnderbust) : rawUnderbust;
  const bustCm = unit === "in" ? inchesToCm(rawBust) : rawBust;

  if (strictRange && (underbustCm < 55 || underbustCm > 150)) {
    errors.push({
      field: "underbust",
      message: "下胸围请输入 55–150 cm 之间的数值。",
    });
  }

  if (strictRange && (bustCm < 60 || bustCm > 160)) {
    errors.push({
      field: "bust",
      message: "胸围请输入 60–160 cm 之间的数值。",
    });
  }

  if (errors.length === 0 && bustCm <= underbustCm) {
    errors.push({
      field: "bust",
      message: "胸围应大于下胸围，请检查测量位置。",
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const differenceCm = roundToOne(bustCm - underbustCm);
  const band = Math.round(underbustCm / 5) * 5;
  const cup = getCupByDifference(differenceCm);
  const sizes = getReferenceSizes(band, cup.index);
  const cupPosition =
    cup.index <= 0 ? 0 : Math.min(100, ((cup.index - 1) / 6) * 100);

  return {
    valid: true,
    underbustCm,
    bustCm,
    differenceCm,
    band,
    cup: cup.label,
    cupIndex: cup.index,
    cupPosition,
    sizes,
    fitAdvice: getFitAdvice(cup.label),
    errors: [],
  };
}
