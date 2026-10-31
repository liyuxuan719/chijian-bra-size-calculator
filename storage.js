import { calculateSize } from "./sizing.js";

export const STORAGE_KEY = "chijian-measurements-v1";

export function readMeasurements(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!saved || !Number.isFinite(saved.underbust) || !Number.isFinite(saved.bust) ||
        !["cm", "in"].includes(saved.unit)) return null;
    // Measurements are always stored in cm, regardless of the display unit.
    if (!calculateSize({ underbust: saved.underbust, bust: saved.bust }).valid) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveMeasurements(storage, measurements, remember) {
  try {
    if (!remember) {
      storage.removeItem(STORAGE_KEY);
    } else {
      if (!["cm", "in"].includes(measurements.unit) ||
          !calculateSize({ underbust: measurements.underbust, bust: measurements.bust }).valid) return false;
      storage.setItem(STORAGE_KEY, JSON.stringify(measurements));
    }
    return true;
  } catch {
    return false;
  }
}
