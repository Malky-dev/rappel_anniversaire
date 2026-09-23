"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const context = vm.createContext({});
vm.runInContext(readFileSync(join(__dirname, "../extension/registry-view.js"), "utf8"), context);

const contacts = [
  { name: "Zoé", birthday: "1980-12-01", phone: "06 12 34", comment: "Thé préféré" },
  { name: "Élodie", birthday: "2000-01-20", phone: "07 56 78", comment: "Chocolat" },
  { name: "Aragorn", birthday: "2931-01-20", phone: "", comment: "Banquet" },
  { name: "Bilbo", birthday: "1990-01-02", phone: "", comment: "" },
];
const names = (query, sort) => Array.from(context.selectContacts(contacts, query, sort), (contact) => contact.name);

test("ordre alphabétique français, y compris les accents", () => {
  assert.deepEqual(names("", "name"), ["Aragorn", "Bilbo", "Élodie", "Zoé"]);
});
test("mois puis jour, année ignorée et noms à date égale", () => {
  assert.deepEqual(names("", "birthday"), ["Bilbo", "Aragorn", "Élodie", "Zoé"]);
});
test("recherche sans casse ni accents, avec plusieurs termes", () => {
  assert.deepEqual(names("  ZOE   the  ", "name"), ["Zoé"]);
});
test("recherche dans le téléphone et le commentaire", () => {
  assert.deepEqual(names("56 78", "name"), ["Élodie"]);
  assert.deepEqual(names("banquet", "name"), ["Aragorn"]);
});
test("recherche combinée au tri et absence de résultat", () => {
  assert.deepEqual(names("o", "birthday"), ["Bilbo", "Aragorn", "Élodie", "Zoé"]);
  assert.deepEqual(names("introuvable", "name"), []);
});
test("liste vide et recherche vide", () => {
  assert.equal(context.selectContacts([], "", "name").length, 0);
  assert.equal(names("   ", "name").length, 4);
});
test("tri sans mutation de la liste source", () => {
  const before = JSON.stringify(contacts);
  names("", "birthday");
  assert.equal(JSON.stringify(contacts), before);
});

test("accordéons : douze mois, mois vides et années ignorées", () => {
  const groups = context.groupContactsByMonth(context.selectContacts(contacts, "", "name"));
  assert.equal(groups.length, 12);
  assert.deepEqual(Array.from(groups[0], (contact) => contact.name), ["Aragorn", "Bilbo", "Élodie"]);
  assert.equal(groups[1].length, 0);
  assert.equal(groups[11][0].name, "Zoé");
  assert.equal(groups.flat().length, contacts.length);
});
test("accordéons : tri des jours conservé dans chaque mois", () => {
  const groups = context.groupContactsByMonth(context.selectContacts(contacts, "", "birthday"));
  assert.deepEqual(Array.from(groups[0], (contact) => contact.name), ["Bilbo", "Aragorn", "Élodie"]);
  assert.equal(context.groupContactsByMonth([]).every((month) => month.length === 0), true);
});
