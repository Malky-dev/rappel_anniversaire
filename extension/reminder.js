"use strict";
(() => {
  const api = getExtensionApi();
  if (!api) { showStorageUnavailable(); return; }
  const status = document.querySelector("#status");
  const list = document.querySelector("#today-contacts");
  const buttons = [...document.querySelectorAll("button")];
  async function refresh() {
    try {
      const stored = await api.storage.local.get(null);
      const contacts = Object.entries(stored).filter(([key]) => key.startsWith("contact:")).map(([, contact]) => contact);
      const today = findBirthdaysForDate(contacts).sort((a, b) => a.name.localeCompare(b.name, "fr"));
      list.replaceChildren();
      status.textContent = today.length ? `${today.length} anniversaire(s) aujourd’hui.` : "Aucun anniversaire aujourd’hui.";
      for (const contact of today) {
        const item = document.createElement("li");
        const title = document.createElement("h2");
        title.textContent = contact.name;
        item.append(title);
        for (const value of [formatBirthday(contact.birthday), contact.phone, contact.comment]) {
          if (!value) continue;
          const paragraph = document.createElement("p");
          paragraph.textContent = value;
          item.append(paragraph);
        }
        list.append(item);
      }
    } catch (error) { status.textContent = "Impossible de lire les anniversaires. Rechargez cette fenêtre."; }
  }
  async function dismiss(type) {
    buttons.forEach((button) => { button.disabled = true; });
    try {
      const result = await api.runtime.sendMessage({ type });
      if (!result?.ok) throw new Error(result?.error ?? "Le service de rappel ne répond pas.");
      window.close();
    } catch (error) {
      status.textContent = `Impossible de suspendre le rappel : ${error.message}`;
      buttons.forEach((button) => { button.disabled = false; });
    }
  }
  document.querySelector("#mute").addEventListener("click", () => dismiss("mute-today"));
  document.querySelector("#later").addEventListener("click", () => dismiss("snooze"));
  api.storage.onChanged.addListener(refresh);
  window.addEventListener("focus", refresh);
  setInterval(refresh, 30000);
  refresh();
})();
