import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import * as sizing from "./sizing.js";
import * as storage from "./storage.js";

const source = (await readFile(new URL("./app.js", import.meta.url), "utf8"))
  .replace(/^import[\s\S]*?;\s*/gm, "");
const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

function createApp({ blockedStorage = false } = {}) {
  const elements = new Map();
  const element = () => ({
    value: "", checked: false, disabled: false, textContent: "", children: [], listeners: {},
    classList: { toggle() {}, add() {}, remove() {} },
    style: { setProperty() {} }, dataset: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute() {}, removeAttribute() {},
    replaceChildren(...nodes) { this.children = nodes; },
    append(...nodes) { this.children.push(...nodes); },
    get childElementCount() { return this.children.length; },
    querySelector: () => element(), focus() {}, scrollIntoView() {},
  });
  const units = ["cm", "in"].map(unit => Object.assign(element(), { dataset: { unit } }));
  const document = {
    querySelector(selector) {
      if (selector.startsWith("#")) assert.ok(html.includes(`id="${selector.slice(1)}"`), `Missing UI binding: ${selector}`);
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === "[data-unit]") return units;
      if (selector === "[data-unit-label]") return [element(), element()];
      if (selector.includes("data-range-min")) return Array.from({ length: 4 }, element);
      return [];
    },
    createElement: element, createTextNode: text => ({ textContent: text }),
    addEventListener() {},
  };
  const context = {
    ...sizing, ...storage, document, navigator: {},
    window: { clearTimeout() {}, setTimeout: () => 1 },
    localStorage: {
      getItem() { if (blockedStorage) throw new Error("SecurityError"); return null; },
      setItem() {}, removeItem() {},
    },
  };
  vm.runInNewContext(source, context);
  return { elements, units };
}

test("inline size tracks full results through edits, validation errors, and recovery", () => {
  const { elements } = createApp();
  const bust = elements.get("#bust");
  assert.equal(elements.get("#inline-size").textContent, "75C");
  bust.value = "95";
  bust.listeners.input();
  assert.equal(elements.get("#inline-size").textContent, "75E");
  assert.equal(elements.get("#size-cn").textContent, "75E");
  bust.value = "";
  bust.listeners.input();
  assert.equal(elements.get("#inline-size").textContent, "—");
  assert.match(elements.get("#inline-result-hint").textContent, /请输入/);
  assert.equal(elements.get("#copy-button").disabled, true);
  bust.value = "90";
  bust.listeners.input();
  assert.equal(elements.get("#inline-size").textContent, "75C");
  assert.equal(elements.get("#copy-button").disabled, false);
});

test("inline summary remains consistent when units change and storage is blocked", () => {
  const { elements, units } = createApp({ blockedStorage: true });
  units[1].listeners.click();
  assert.equal(elements.get("#inline-size").textContent, "75C");
  assert.equal(elements.get("#size-cn").textContent, "75C");
  assert.equal(elements.get("#underbust").value, "29.5");
  units[0].listeners.click();
  assert.equal(elements.get("#inline-size").textContent, "75C");
});
