import test from "node:test";
import assert from "node:assert/strict";
import { readMeasurements, saveMeasurements, STORAGE_KEY } from "./storage.js";

function storage(initial = null) {
  const values = new Map(initial === null ? [] : [[STORAGE_KEY, initial]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test("new visitors have no saved values; explicitly saved inch display keeps cm values", () => {
  const store = storage();
  const measurements = { underbust: 75, bust: 90, unit: "in" };
  assert.equal(readMeasurements(store), null);
  assert.equal(saveMeasurements(store, measurements, true), true);
  assert.deepEqual(readMeasurements(store), measurements);
  assert.equal(saveMeasurements(store, measurements, false), true);
  assert.equal(readMeasurements(store), null);
});

test("v1 records migrate without changing units or measurements", () => {
  const legacy = { underbust: 80, bust: 95, unit: "cm" };
  assert.deepEqual(readMeasurements(storage(JSON.stringify(legacy))), legacy);
});

test("malformed, incomplete, inverted, and invalid records are ignored", () => {
  for (const value of ["broken", "null", "[]", '{"unit":"cm","underbust":90,"bust":80}', '{"unit":"cm","underbust":"75","bust":90}']) {
    assert.equal(readMeasurements(storage(value)), null);
  }
  assert.equal(saveMeasurements(storage(), {underbust: NaN, bust: 90, unit: "cm"}, true), false);
});

test("blocked browser storage never crashes reads, saves, or clears", () => {
  const denied = () => { throw new Error("SecurityError"); };
  const store = { getItem: denied, setItem: denied, removeItem: denied };
  assert.equal(readMeasurements(store), null);
  assert.equal(saveMeasurements(store, { underbust: 75, bust: 90, unit: "cm" }, true), false);
  assert.equal(saveMeasurements(store, {}, false), false);
});
