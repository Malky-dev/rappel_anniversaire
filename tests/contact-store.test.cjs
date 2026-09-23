"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({});
for (const name of ["contact-store.js", "contacts.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../extension", name), "utf8"), context);
}
const demo = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/demo-contacts.json"), "utf8"));
function setup() {
  const data = {};
  const storage = {
    async get(key) { return key === null ? { ...data } : { [key]: data[key] }; },
    async set(values) { Object.assign(data, values); },
    async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; },
  };
  return { data, storage, store: context.createContactStore(storage) };
}
test("100 contacts uniques et valides, exactement 3 aujourd’hui et 3 demain", () => {
  assert.equal(demo.contacts.length, 100);
  assert.equal(new Set(demo.contacts.map((contact) => contact.id)).size, 100);
  for (const contact of demo.contacts) assert.equal(context.parseBirthday(contact.birthday), contact.birthday);
  assert.equal(demo.contacts.filter((contact) => contact.birthday.endsWith("09-23")).length, 3);
  assert.equal(demo.contacts.filter((contact) => contact.birthday.endsWith("09-24")).length, 3);
});
test("modifier conserve l’identifiant sans créer de doublon", async () => {
  const { store, data } = setup();
  await store.save({ id: "one", name: "Avant" });
  await store.save({ id: "one", name: "Après" }, true);
  assert.equal(Object.keys(data).length, 1);
  assert.equal((await store.get("one")).name, "Après");
});
test("suppression ciblée et refus de réenregistrer une fiche supprimée", async () => {
  const { store } = setup();
  await store.save({ id: "one" });
  await store.save({ id: "two" });
  await store.remove("one");
  assert.equal(await store.get("one"), null);
  assert.equal((await store.get("two")).id, "two");
  await assert.rejects(store.save({ id: "one" }, true), /supprimée/);
});
test("chargements répétés sans doublons ni écrasement des fiches existantes", async () => {
  const { store, data } = setup();
  await store.save({ id: "personal", name: "Personnel" });
  assert.equal(await store.addMissing(demo.contacts), 100);
  await store.save({ ...demo.contacts[0], name: "Corrigé" }, true);
  assert.equal(await store.addMissing(demo.contacts), 0);
  assert.equal(Object.keys(data).length, 101);
  assert.equal((await store.get(demo.contacts[0].id)).name, "Corrigé");
  assert.equal((await store.get("personal")).name, "Personnel");
});
test("les erreurs de stockage sont transmises à l’interface", async () => {
  const { store, storage } = setup();
  storage.set = async () => { throw new Error("stockage indisponible"); };
  await assert.rejects(store.save({ id: "one" }), /indisponible/);
  storage.remove = async () => { throw new Error("suppression refusée"); };
  await assert.rejects(store.remove("one"), /refusée/);
});

test("nettoyage exact des démos modifiées, préservation des contacts et réglages", async () => {
  const { store, data } = setup();
  await store.addMissing(demo.contacts);
  await store.save({ ...demo.contacts[0], name: "Renommé" }, true);
  await store.save({ id: "manual", name: demo.contacts[1].name });
  await store.save({ id: "demo-20260923-autre", name: "Autre contact" });
  data.settings = { mutedDate: "2026-09-23" };
  await store.remove(demo.contacts[2].id);
  const ids = demo.contacts.map((contact) => contact.id);
  assert.equal(await store.removeKnownContacts(ids), 99);
  assert.deepEqual(Object.keys(data).sort(), ["contact:demo-20260923-autre", "contact:manual", "settings"]);
  assert.equal(await store.removeKnownContacts(ids), 0);
});
test("échec du nettoyage transmis sans annonce de réussite", async () => {
  const { store, storage } = setup();
  await store.addMissing(demo.contacts);
  storage.remove = async () => { throw new Error("suppression refusée"); };
  await assert.rejects(store.removeKnownContacts(demo.contacts.map((contact) => contact.id)), /refusée/);
});

test("Chrome utilisé si browser existe sans stockage", () => {
  const chrome = { storage: { local: {}, onChanged: {} } };
  assert.equal(context.getExtensionApi({ browser: {}, chrome }), chrome);
});
test("Firefox sélectionné quand son stockage est disponible", () => {
  const browser = { storage: { local: {}, onChanged: {} } };
  assert.equal(context.getExtensionApi({ browser }), browser);
});
test("absence de permission ou page ordinaire détectée sans TypeError", () => {
  assert.equal(context.getExtensionApi({ chrome: {} }), null);
  assert.equal(context.getExtensionApi({}), null);
});
