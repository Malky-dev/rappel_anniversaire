"use strict";

(() => {
  const extensionApi = getExtensionApi();
  if (!extensionApi) {
    showStorageUnavailable();
    return;
  }
  const contactStore = createContactStore(extensionApi.storage.local);
  const editingId = new URLSearchParams(location.search).get("id");
  const form = document.querySelector("#contact-form");
  const fields = document.querySelector("#contact-fields");
  const nameInput = document.querySelector("#name");
  const birthdayInput = document.querySelector("#birthday");
  const phoneInput = document.querySelector("#phone");
  const commentInput = document.querySelector("#comment");
  const statusMessage = document.querySelector("#status");
  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
  birthdayInput.addEventListener("input", () => birthdayInput.setCustomValidity(""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (fields.disabled) return;

    const name = nameInput.value.trim();
    const birthday = parseBirthday(birthdayInput.value);
    nameInput.setCustomValidity(name ? "" : "Renseignez un nom, pas seulement des espaces.");
    birthdayInput.setCustomValidity(birthday ? "" : "Sélectionnez une date de naissance valide.");
    if (!form.reportValidity()) return;

    const contact = {
      id: editingId || crypto.randomUUID(),
      name,
      birthday,
      phone: phoneInput.value.trim(),
      comment: commentInput.value.trim(),
    };

    fields.disabled = true;
    statusMessage.textContent = "Enregistrement…";
    try {
      // Une clé par fiche évite d’écraser celles ajoutées depuis une autre fenêtre.
      await contactStore.save(contact, Boolean(editingId));
    } catch (error) {
      statusMessage.textContent = "Enregistrement impossible. La fiche a peut-être été supprimée ou le stockage est indisponible. Votre saisie reste dans cette page.";
      console.error("Enregistrement de la fiche impossible", error);
      fields.disabled = false;
      return;
    }

    if (!editingId) form.reset();
    fields.disabled = false;
    statusMessage.textContent = editingId ? "Fiche modifiée." : "Fiche enregistrée.";
    nameInput.focus();
  });

  async function initializeForm() {
    if (!editingId) {
      fields.disabled = false;
      return;
    }
    document.querySelector("#form-title").textContent = "Modifier un compagnon";
    document.title = "Modifier un compagnon — Rappel anniversaire";
    form.querySelector("button[type=submit]").textContent = "Enregistrer les modifications";
    try {
      const contact = await contactStore.get(editingId);
      if (!contact) {
        statusMessage.textContent = "Cette fiche n’existe plus. Revenez au registre.";
        return;
      }
      nameInput.value = contact.name;
      birthdayInput.value = contact.birthday;
      phoneInput.value = contact.phone;
      commentInput.value = contact.comment;
      fields.disabled = false;
    } catch (error) {
      statusMessage.textContent = "Impossible de charger cette fiche. Rechargez la page pour réessayer.";
      console.error("Chargement de la fiche impossible", error);
    }
  }

  initializeForm();
})();
