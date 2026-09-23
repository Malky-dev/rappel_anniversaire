"use strict";

function getExtensionApi(scope = globalThis) {
  return [scope.browser, scope.chrome].find((api) =>
    api?.storage?.local && api?.storage?.onChanged
  ) ?? null;
}

function showStorageUnavailable() {
  const message = document.querySelector("#status");
  message.textContent = "Stockage indisponible. Rechargez l’extension dans la page de gestion des extensions du navigateur, puis fermez cet onglet et rouvrez le registre depuis l’icône de l’extension.";
  message.setAttribute("role", "alert");
  for (const control of document.querySelectorAll("button, input, select, textarea, fieldset")) {
    control.disabled = true;
  }
}

function createContactStore(storage) {
  return {
    async get(id) {
      const key = `contact:${id}`;
      return (await storage.get(key))[key] ?? null;
    },
    async save(contact, editing = false) {
      if (editing && !(await this.get(contact.id))) {
        throw new Error("Cette fiche a été supprimée. Revenez au registre.");
      }
      await storage.set({ [`contact:${contact.id}`]: contact });
    },
    async remove(id) {
      await storage.remove(`contact:${id}`);
    },
    async removeKnownContacts(ids) {
      const stored = await storage.get(null);
      const keys = [...new Set(ids)].map((id) => `contact:${id}`)
        .filter((key) => Object.hasOwn(stored, key));
      if (keys.length) await storage.remove(keys);
      return keys.length;
    },
    async addMissing(contacts) {
      const stored = await storage.get(null);
      const additions = {};
      for (const contact of contacts) {
        const key = `contact:${contact.id}`;
        if (!Object.hasOwn(stored, key)) additions[key] = contact;
      }
      if (Object.keys(additions).length) await storage.set(additions);
      return Object.keys(additions).length;
    },
  };
}
