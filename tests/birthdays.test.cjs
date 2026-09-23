"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({});
for (const file of ["contacts.js", "birthdays.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../extension", file), "utf8"), context);
}
const demo = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/demo-contacts.json"), "utf8"));
test("trois anniversaires le 23 et trois autres le 24 septembre", () => {
  const today = context.findBirthdaysForDate(demo.contacts, new Date(2026, 8, 23));
  const tomorrow = context.findBirthdaysForDate(demo.contacts, new Date(2026, 8, 24));
  assert.equal(today.length, 3);
  assert.equal(tomorrow.length, 3);
  assert.ok(today.every((a) => tomorrow.every((b) => a.id !== b.id)));
});
test("jour et mois obligatoires, année ignorée, source conservée", () => {
  const contacts = [{ birthday: "1950-09-23" }, { birthday: "2000-09-23" }, { birthday: "1980-10-23" }, { birthday: "1980-09-24" }];
  const before = JSON.stringify(contacts);
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2026, 8, 23)).length, 2);
  assert.equal(JSON.stringify(contacts), before);
});
test("aucun résultat et dates invalides", () => {
  const date = new Date(2026, 8, 23);
  assert.equal(context.findBirthdaysForDate([], date).length, 0);
  assert.equal(context.findBirthdaysForDate([{ birthday: "invalide" }, {}, { birthday: "0000-09-23" }], date).length, 0);
});
test("29 février uniquement le 29 février", () => {
  const contacts = [{ birthday: "2000-02-29" }];
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2028, 1, 29)).length, 1);
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2026, 1, 28)).length, 0);
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2026, 2, 1)).length, 0);
});
test("passage à minuit et changement d’année", () => {
  const contacts = [{ birthday: "1990-12-31" }, { birthday: "1991-01-01" }];
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2026, 11, 31, 23, 59))[0], contacts[0]);
  assert.equal(context.findBirthdaysForDate(contacts, new Date(2027, 0, 1, 0, 0))[0], contacts[1]);
});
test("date locale plutôt que conversion UTC", () => {
  const localDate = { getFullYear: () => 2026, getMonth: () => 8, getDate: () => 23, toISOString: () => { throw new Error("UTC interdit"); } };
  assert.equal(context.getLocalDateKey(localDate), "2026-09-23");
  assert.equal(context.findBirthdaysForDate(demo.contacts, localDate).length, 3);
});
