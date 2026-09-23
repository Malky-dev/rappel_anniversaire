"use strict";
(() => {
  const api = getExtensionApi();
  if (!api) { showStorageUnavailable(); return; }
  const status = document.querySelector("#status");
  const importer = document.querySelector("#import-data");
  const exporter = document.querySelector("#export-data");
  const fileInput = document.querySelector("#import-file");
  function busy(value) { importer.disabled = value; exporter.disabled = value; }
  importer.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    busy(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Le fichier dépasse 5 Mo.");
      const contacts = validateBackup(JSON.parse((await file.text()).replace(/^\uFEFF/, "")));
      const stored = await api.storage.local.get(null);
      const replaced = contacts.filter((contact) => Object.hasOwn(stored, `contact:${contact.id}`)).length;
      if (!window.confirm(`Importer ${contacts.length} fiche(s) : ${contacts.length - replaced} ajout(s), ${replaced} remplacement(s) ? Les autres fiches seront conservées.`)) {
        status.textContent = "Import annulé.";
        return;
      }
      const values = Object.fromEntries(contacts.map((contact) => [`contact:${contact.id}`, contact]));
      if (contacts.length) await api.storage.local.set(values);
      status.textContent = `${contacts.length} fiche(s) importée(s).`;
    } catch (error) {
      status.textContent = `Import impossible : ${error.message}`;
    } finally { busy(false); fileInput.value = ""; }
  });
  exporter.addEventListener("click", async () => {
    busy(true);
    try {
      const stored = await api.storage.local.get(null);
      const contacts = Object.entries(stored).filter(([key]) => key.startsWith("contact:")).map(([, contact]) => contact);
      const backup = { schemaVersion: 1, exportedAt: new Date().toISOString(), contacts };
      validateBackup(backup);
      const blob = new Blob([JSON.stringify(backup, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rappel-anniversaire-${getLocalDateKey()}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = "Export lancé. Vérifiez les téléchargements du navigateur.";
    } catch (error) { status.textContent = `Export impossible : ${error.message}`; }
    finally { busy(false); }
  });
})();
