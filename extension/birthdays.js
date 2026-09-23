"use strict";

function getLocalDateKey(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findBirthdaysForDate(contacts, date = new Date()) {
  const monthDay = getLocalDateKey(date).slice(5);
  return contacts.filter((contact) =>
    typeof contact.birthday === "string"
    && parseBirthday(contact.birthday) !== null
    && contact.birthday.slice(5) === monthDay
  );
}
