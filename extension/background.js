"use strict";

// Chrome charge ces fichiers dans son service worker ; Firefox les liste dans le manifeste.
if (typeof importScripts === "function") {
  importScripts("contacts.js", "birthdays.js", "reminder-policy.js");
}
const api = globalThis.browser?.storage ? globalThis.browser : globalThis.chrome;
const alarmName = "birthday-even-hour";
const reminderUrl = api.runtime.getURL("reminder.html");
let operations = Promise.resolve();
function enqueue(operation) {
  const result = operations.then(operation);
  operations = result.catch((error) => console.error("Rappels :", error));
  return result;
}
async function scheduleNext() {
  await api.alarms.create(alarmName, { when: nextEvenHour() });
}
async function showReminderWindow() {
  const tabs = await api.tabs.query({});
  const existing = tabs.find((tab) => tab.url === reminderUrl);
  if (existing) {
    await api.tabs.update(existing.id, { active: true });
    await api.windows.update(existing.windowId, { focused: true });
  } else {
    await api.windows.create({ url: reminderUrl, type: "popup", width: 520, height: 700, focused: true });
  }
}
async function checkBirthdays() {
  const now = new Date();
  const stored = await api.storage.local.get(null);
  if (!reminderAllowed(stored.reminderState ?? {}, now)) return { shown: false, reason: "Les rappels sont suspendus." };
  const contacts = Object.entries(stored).filter(([key]) => key.startsWith("contact:")).map(([, value]) => value);
  const birthdays = findBirthdaysForDate(contacts, now);
  if (!birthdays.length) return { shown: false, reason: "Aucun anniversaire aujourd’hui." };
  await showReminderWindow();
  try {
    await api.notifications.create("birthday", {
      type: "basic", iconUrl: api.runtime.getURL("icons/icon128.png"),
      title: "Rappel anniversaire", message: `${birthdays.length} anniversaire(s) à célébrer aujourd’hui.`,
    });
  } catch (error) {
    // Une notification système bloquée ne doit pas empêcher la fenêtre ni la prochaine alarme.
    console.warn("Notification système indisponible", error);
  }
  return { shown: true, count: birthdays.length };
}
async function scheduledCheck() {
  try { return await checkBirthdays(); }
  finally { await scheduleNext(); }
}
api.runtime.onStartup.addListener(() => { enqueue(scheduledCheck); });
api.runtime.onInstalled.addListener(() => { enqueue(scheduledCheck); });
api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === alarmName) enqueue(scheduledCheck);
});
api.notifications.onClicked.addListener((id) => {
  if (id === "birthday") enqueue(checkBirthdays);
});
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || !["test-reminder", "mute-today", "snooze"].includes(message?.type)) return false;
  enqueue(async () => {
    if (message.type === "test-reminder") return scheduledCheck();
    const now = new Date();
    const { reminderState = {} } = await api.storage.local.get("reminderState");
    if (message.type === "mute-today") reminderState.mutedDate = getLocalDateKey(now);
    else reminderState.snoozeUntil = nextEvenHour(now);
    await api.storage.local.set({ reminderState });
    await api.notifications.clear("birthday");
    await scheduleNext();
    return { saved: true };
  }).then((result) => respond({ ok: true, ...result }), (error) => respond({ ok: false, error: error.message }));
  return true;
});
// Les alarmes peuvent disparaître au redémarrage : les recréer si nécessaire.
enqueue(async () => {
  if (!(await api.alarms.get(alarmName))) await scheduleNext();
});
