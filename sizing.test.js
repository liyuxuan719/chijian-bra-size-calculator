import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSize,
  cmToInches,
  formatMeasurement,
  getCupByDifference,
  getReferenceSizes,
  inchesToCm,
  getSisterSizes,
} from "./sizing.js";

test("calculates the default 75 / 90 cm measurement as 75C", () => {
  const result = calculateSize({ underbust: 75, bust: 90 });

  assert.equal(result.valid, true);
  assert.equal(result.band, 75);
  assert.equal(result.cup, "C");
  assert.equal(result.differenceCm, 15);
  assert.deepEqual(result.sizes, {
    cn: "75C",
    eu: "75C",
    us: "34C",
    uk: "34C",
  });
});

test("suggests adjacent bands with opposite cup steps in each region", () => {
  assert.deepEqual(getSisterSizes(75, 3), [
    { fit: "底围更紧", sizes: { cn: "70D", eu: "70D", us: "32D", uk: "32D" } },
    { fit: "底围更松", sizes: { cn: "80B", eu: "80B", us: "36B", uk: "36B" } },
  ]);
  assert.equal(getSisterSizes(55, 0).length, 0);
  assert.equal(getSisterSizes(150, 12).length, 0);
  assert.equal(getSisterSizes(75, 0).length, 1);
  assert.deepEqual(getSisterSizes(75, NaN), []);
  assert.deepEqual(getSisterSizes(73, 3), []);
});

test("rounds the underbust to the closest five-centimeter band", () => {
  const result = calculateSize({ underbust: 72.5, bust: 85 });

  assert.equal(result.valid, true);
  assert.equal(result.band, 75);
  assert.equal(result.sizes.us, "34B");
  assert.equal(result.sizes.uk, "34B");
});

test("keeps the calculated size stable when the same values are entered in inches", () => {
  const metric = calculateSize({ underbust: 80, bust: 96 });
  const imperial = calculateSize({
    underbust: cmToInches(80),
    bust: cmToInches(96),
    unit: "in",
  });

  assert.equal(imperial.valid, true);
  assert.equal(imperial.sizes.cn, metric.sizes.cn);
  assert.equal(imperial.sizes.us, metric.sizes.us);
});

test("maps larger cup letters for US and UK reference sizes", () => {
  const eCup = calculateSize({ underbust: 75, bust: 95 });
  const fCup = calculateSize({ underbust: 75, bust: 97.5 });
  const gCup = calculateSize({ underbust: 75, bust: 100 });

  assert.equal(eCup.sizes.us, "34DD/E");
  assert.equal(eCup.sizes.uk, "34DD");
  assert.equal(fCup.sizes.us, "34DDD/F");
  assert.equal(fCup.sizes.uk, "34E");
  assert.equal(gCup.sizes.us, "34G");
  assert.equal(gCup.sizes.uk, "34F");
});

test("classifies cup boundaries consistently", () => {
  assert.equal(getCupByDifference(7.5).label, "AA");
  assert.equal(getCupByDifference(10).label, "A");
  assert.equal(getCupByDifference(12.5).label, "B");
  assert.equal(getCupByDifference(15).label, "C");
  assert.equal(getCupByDifference(17.5).label, "D");
  assert.equal(getCupByDifference(20).label, "E");
});

test("rejects incomplete, inverted, and out-of-range measurements", () => {
  assert.equal(calculateSize({ underbust: "", bust: 90 }).valid, false);
  assert.equal(calculateSize({ underbust: 90, bust: 85 }).valid, false);
  assert.equal(calculateSize({ underbust: 40, bust: 90 }).valid, false);
  assert.equal(calculateSize({ underbust: 75, bust: 200 }).valid, false);
});

test("converts measurements and formats one decimal place", () => {
  assert.equal(cmToInches(2.54), 1);
  assert.equal(inchesToCm(1), 2.54);
  assert.equal(formatMeasurement(75, "cm"), "75");
  assert.equal(formatMeasurement(75, "in"), "29.5");
});

test("generates reference sizes from a band and cup index", () => {
  assert.deepEqual(getReferenceSizes(70, 2), {
    cn: "70B",
    eu: "70B",
    us: "32B",
    uk: "32B",
  });
  assert.deepEqual(getReferenceSizes(85, 5), {
    cn: "85E",
    eu: "85E",
    us: "38DD/E",
    uk: "38DD",
  });
});
