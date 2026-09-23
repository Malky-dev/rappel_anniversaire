"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = (file) => fs.readFileSync(path.join(__dirname, "../extension", file), "utf8");
const context = vm.createContext({});
for (const file of ["contacts.js", "birthdays.js", "reminder-policy.js", "transfer.js"]) vm.runInContext(source(file), context);
const contact = { id: "one", name: "Élodie", birthday: "2000-02-29", phone: "01 23", comment: "<script>texte</script>" };
test("prochaine heure paire : heure impaire, paire exacte, minuit", () => {
  for (const [date, expected] of [
    [new Date(2026, 8, 23, 13, 37), new Date(2026, 8, 23, 14)],
    [new Date(2026, 8, 23, 14), new Date(2026, 8, 23, 16)],
    [new Date(2026, 11, 31, 23, 59), new Date(2027, 0, 1)],
  ]) assert.equal(context.nextEvenHour(date), expected.getTime());
});
test("suspension du jour et reprise le lendemain", () => {
  assert.equal(context.reminderAllowed({ mutedDate: "2026-09-23" }, new Date(2026, 8, 23, 22)), false);
  assert.equal(context.reminderAllowed({ mutedDate: "2026-09-23" }, new Date(2026, 8, 24)), true);
});
test("report actif avant l’heure paire et levé à l’heure exacte", () => {
  const state = { snoozeUntil: new Date(2026, 8, 23, 14).getTime() };
  assert.equal(context.reminderAllowed(state, new Date(2026, 8, 23, 13, 59)), false);
  assert.equal(context.reminderAllowed(state, new Date(2026, 8, 23, 14)), true);
});
test("import valide, Unicode et contenu textuel préservés", () => {
  const backup = { schemaVersion: 1, contacts: [contact] };
  assert.equal(JSON.stringify(context.validateBackup(JSON.parse(JSON.stringify(backup)))), JSON.stringify([contact]));
});
test("import : rejet global des dates invalides, doublons et types incorrects", () => {
  for (const patch of [{ birthday: "2025-02-29" }, { name: "  " }, { phone: 123 }, { id: "../x" }, { comment: null }]) {
    assert.throws(() => context.validateBackup({ schemaVersion: 1, contacts: [contact, { ...contact, id: "two", ...patch }] }));
  }
  assert.throws(() => context.validateBackup({ schemaVersion: 1, contacts: [contact, contact] }));
  assert.throws(() => context.validateBackup({ schemaVersion: 2, contacts: [] }));
  assert.throws(() => context.validateBackup(null));
});
function event() {
  const listeners = [];
  return { addListener(fn) { listeners.push(fn); }, listeners };
}
async function backgroundHarness() {
  const data = {};
  const tabs = [];
  const alarms = {};
  const notifications = [];
  const now = new Date();
  const key = context.getLocalDateKey(now);
  for (let i = 0; i < 3; i++) data[`contact:${i}`] = { ...contact, id: String(i), birthday: `2000-${key.slice(5)}` };
  const api = {
    runtime: { id: "test", getURL: (name) => `chrome-extension://test/${name}`, onStartup: event(), onInstalled: event(), onMessage: event() },
    storage: { local: { async get(key) { return key === null ? { ...data } : { [key]: data[key] }; }, async set(values) { Object.assign(data, values); }, async remove(keys) { for (const key of keys) delete data[key]; } } },
    tabs: { async query() { return tabs; }, async update() {} },
    windows: { async create(options) { tabs.push({ url: options.url, id: 1, windowId: 1 }); }, async update() {} },
    alarms: { async create(name, value) { alarms[name] = value; }, async get(name) { return alarms[name]; }, onAlarm: event() },
    notifications: { async create(id, value) { notifications.push(value); }, async clear() {}, onClicked: event() },
  };
  const sandbox = vm.createContext({ chrome: api, console });
  for (const file of ["contacts.js", "birthdays.js", "reminder-policy.js", "background.js"]) vm.runInContext(source(file), sandbox);
  const drain = () => vm.runInContext("operations", sandbox);
  await drain();
  const send = (type) => new Promise((resolve) => api.runtime.onMessage.listeners[0]({ type }, { id: "test" }, resolve));
  return { data, tabs, api, alarms, notifications, drain, send };
}
test("démarrage et alarme : une seule fenêtre pour trois anniversaires", async () => {
  const h = await backgroundHarness();
  h.api.runtime.onStartup.listeners[0](); await h.drain();
  assert.equal(h.tabs.length, 1);
  assert.match(h.notifications[0].message, /3 anniversaire/);
  h.api.alarms.onAlarm.listeners[0]({ name: "birthday-even-hour" }); await h.drain();
  assert.equal(h.tabs.length, 1);
  assert.ok(h.alarms["birthday-even-hour"].when > Date.now());
});
test("ignorer persiste et empêche le rappel, report également", async () => {
  const h = await backgroundHarness();
  assert.equal((await h.send("mute-today")).ok, true);
  assert.equal(h.data.reminderState.mutedDate, context.getLocalDateKey());
  assert.equal((await h.send("test-reminder")).shown, false);
  assert.equal(h.tabs.length, 0);
  h.data.reminderState = {};
  await h.send("snooze");
  assert.equal((await h.send("test-reminder")).shown, false);
});
test("aucune fiche, aucune fenêtre ; panne notification n’arrête pas le rappel", async () => {
  const h = await backgroundHarness();
  h.api.notifications.create = async () => { throw new Error("notifications bloquées"); };
  assert.equal((await h.send("test-reminder")).shown, true);
  for (const key of Object.keys(h.data)) delete h.data[key];
  assert.equal((await h.send("test-reminder")).shown, false);
});

test("mise à jour : nettoyage des seules fiches de démonstration", async () => {
  const h = await backgroundHarness();
  h.data["contact:demo-20260923-001"] = { ...contact };
  h.data["contact:personnel"] = { ...contact };
  h.api.runtime.onInstalled.listeners[0]();
  await h.drain();
  assert.equal(h.data["contact:demo-20260923-001"], undefined);
  assert.ok(h.data["contact:personnel"]);
  assert.ok(h.alarms["birthday-even-hour"]);
});
