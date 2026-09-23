"use strict";

function nextEvenHour(now = new Date()) {
  const next = new Date(now.getTime());
  next.setHours(now.getHours() + (now.getHours() % 2 === 0 ? 2 : 1), 0, 0, 0);
  return next.getTime();
}

function reminderAllowed(state, now = new Date()) {
  return state.mutedDate !== getLocalDateKey(now)
    && !(Number.isFinite(state.snoozeUntil) && state.snoozeUntil > now.getTime());
}
