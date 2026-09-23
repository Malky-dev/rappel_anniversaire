"use strict";

function validateBackup(data) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.contacts) || data.contacts.length > 10000) {
    throw new Error("Format de sauvegarde non reconnu (version 1, maximum 10 000 fiches).");
  }
  const ids = new Set();
  return data.contacts.map((contact, index) => {
    if (!contact || typeof contact.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(contact.id)
      || ids.has(contact.id) || typeof contact.name !== "string" || !contact.name.trim() || contact.name.length > 120
      || typeof contact.birthday !== "string" || !parseBirthday(contact.birthday)
      || typeof contact.phone !== "string" || contact.phone.length > 40
      || typeof contact.comment !== "string" || contact.comment.length > 2000) {
      throw new Error(`Fiche ${index + 1} invalide ou identifiant dupliqué. Aucune donnée importée.`);
    }
    ids.add(contact.id);
    return { id: contact.id, name: contact.name.trim(), birthday: contact.birthday, phone: contact.phone, comment: contact.comment };
  });
}
