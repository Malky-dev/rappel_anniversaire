"use strict";

const nameCollator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

function normalizeSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function selectContacts(contacts, query, sortOrder) {
  const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const selected = contacts.filter((contact) => {
    const searchableText = normalizeSearch([contact.name, contact.phone, contact.comment].join(" "));
    return terms.every((term) => searchableText.includes(term));
  });

  // filter crée une nouvelle liste : sort ne modifie pas les fiches originales.
  return selected.sort((first, second) => {
    if (sortOrder === "birthday") {
      const dateOrder = first.birthday.slice(5).localeCompare(second.birthday.slice(5));
      if (dateOrder !== 0) return dateOrder;
    }
    return nameCollator.compare(first.name, second.name);
  });
}

function groupContactsByMonth(contacts) {
  const months = Array.from({ length: 12 }, () => []);
  for (const contact of contacts) {
    months[Number(contact.birthday.slice(5, 7)) - 1].push(contact);
  }
  return months;
}
