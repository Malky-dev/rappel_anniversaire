"use strict";

// Une date civile reste du texte : aucun décalage de fuseau horaire.
function parseBirthday(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

function formatBirthday(value) {
  return value.split("-").reverse().join("/");
}
