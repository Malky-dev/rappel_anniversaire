"use strict";

(() => {
  const extensionApi = getExtensionApi();
  if (!extensionApi) {
    showStorageUnavailable();
    return;
  }
  const contactStore = createContactStore(extensionApi.storage.local);
  const actionStatus = document.querySelector("#action-status");
  const statusMessage = document.querySelector("#status");
  const list = document.querySelector("#contacts");
  const emptyMessage = document.querySelector("#empty");
  const searchInput = document.querySelector("#search");
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const openMonths = new Map();
  const todayList = document.querySelector("#today-contacts");
  const todayStatus = document.querySelector("#today-status");
  let displayedDay = null;
  let contactsLoaded = false;
  let contacts = [];

  function renderToday() {
    const now = new Date();
    const birthdays = selectContacts(findBirthdaysForDate(contacts, now), "", "name");
    displayedDay = getLocalDateKey(now);
    todayList.replaceChildren();
    const dateLabel = formatBirthday(displayedDay);
    todayStatus.textContent = birthdays.length
      ? `${dateLabel} : ${birthdays.length} anniversaire(s) à célébrer.`
      : `${dateLabel} : aucun anniversaire aujourd’hui.`;
    for (const contact of birthdays) todayList.append(createContactItem(contact));
  }

  function refreshDayIfNeeded() {
    if (contactsLoaded && displayedDay !== getLocalDateKey()) renderToday();
  }

  // Cette veille actualise la page ouverte ; elle ne déclenche pas de rappel.
  setInterval(refreshDayIfNeeded, 30000);
  window.addEventListener("focus", refreshDayIfNeeded);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshDayIfNeeded();
  });

  function renderContacts() {
    // Conserver les mois ouverts lors d’une recherche ou d’une mise à jour.
    for (const accordion of list.querySelectorAll("details[data-month]")) {
      openMonths.set(Number(accordion.dataset.month), accordion.open);
    }
    list.replaceChildren();
    const sortOrder = searchInput.value.trim() ? "name" : "birthday";
    const visibleContacts = selectContacts(contacts, searchInput.value, sortOrder);
    emptyMessage.hidden = visibleContacts.length > 0;
    emptyMessage.textContent = contacts.length === 0
      ? "Aucune fiche enregistrée pour le moment."
      : "Aucun compagnon ne correspond à votre recherche.";
    document.querySelector("#list-title").textContent = `Vos compagnons (${visibleContacts.length})`;
    statusMessage.textContent = "";

    if (searchInput.value.trim()) {
      const results = document.createElement("ul");
      results.className = "contact-list";
      for (const contact of visibleContacts) results.append(createContactItem(contact));
      list.append(results);
      return;
    }

    const groups = groupContactsByMonth(visibleContacts);
    for (const [month, monthContacts] of groups.entries()) {
      if (monthContacts.length === 0) continue;
      const accordion = document.createElement("details");
      accordion.className = "month-group";
      accordion.dataset.month = String(month);
      accordion.open = openMonths.get(month) ?? false;
      const summary = document.createElement("summary");
      summary.textContent = `${monthNames[month]} (${monthContacts.length})`;
      accordion.append(summary);
      if (monthContacts.length) {
        const monthList = document.createElement("ul");
        monthList.className = "contact-list";
        for (const contact of monthContacts) monthList.append(createContactItem(contact));
        accordion.append(monthList);
      } else {
        const message = document.createElement("p");
        message.textContent = "Aucun anniversaire ce mois-ci.";
        accordion.append(message);
      }
      list.append(accordion);
    }
  }

  function createContactItem(contact) {
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editLink = document.createElement("a");
    editLink.className = "icon-button";
    editLink.href = `form.html?id=${encodeURIComponent(contact.id)}`;
    editLink.append(createActionIcon("edit"));
    editLink.title = "Modifier";
    editLink.setAttribute("aria-label", `Modifier ${contact.name}`);
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button icon-danger";
    deleteButton.append(createActionIcon("delete"));
    deleteButton.title = "Supprimer";
    deleteButton.setAttribute("aria-label", `Supprimer ${contact.name}`);
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm(`Supprimer la fiche de ${contact.name} ? Cette action est définitive.`)) return;
      deleteButton.disabled = true;
      try {
        await contactStore.remove(contact.id);
        await loadContacts();
        actionStatus.textContent = `La fiche de ${contact.name} a été supprimée.`;
        searchInput.focus();
      } catch (error) {
        deleteButton.disabled = false;
        actionStatus.textContent = "Suppression impossible. Réessayez.";
        console.error("Suppression impossible", error);
      }
    });
    actions.append(editLink, deleteButton);
    return createContactCard(contact, actions);
  }

  async function loadContacts() {
    try {
      const stored = await extensionApi.storage.local.get(null);
      contacts = Object.entries(stored)
        .filter(([key]) => key.startsWith("contact:"))
        .map(([, contact]) => contact);
      renderContacts();
      renderToday();
      contactsLoaded = true;
      searchInput.disabled = false;
    } catch (error) {
      todayStatus.textContent = "Impossible de vérifier les anniversaires. Rechargez la page pour réessayer.";
      statusMessage.textContent = "Impossible de charger les fiches. Fermez puis rouvrez cette fenêtre pour réessayer.";
      console.error("Chargement des fiches impossible", error);
    }
  }

  searchInput.addEventListener("input", renderContacts);

  // Le registre déjà ouvert se rafraîchit quand une autre page enregistre une fiche.
  extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && Object.keys(changes).some((key) => key.startsWith("contact:"))) {
      loadContacts();
    }
  });

  loadContacts();

})();
