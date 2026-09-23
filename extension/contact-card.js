"use strict";

function createActionIcon(kind) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", kind === "edit"
    ? "M15 5l4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z"
    : "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7");
  svg.append(path);
  return svg;
}

function createContactCard(contact, actions = null) {
  const item = document.createElement("li");
  item.className = "contact-card";
  item.dataset.contactId = contact.id;
  const header = document.createElement("div");
  header.className = "contact-heading";
  const title = document.createElement("h3");
  title.textContent = contact.name;
  header.append(title);
  if (actions) header.append(actions);
  item.append(header);

  const metadata = document.createElement("div");
  metadata.className = "contact-meta";
  const birthday = document.createElement("time");
  birthday.dateTime = contact.birthday;
  birthday.textContent = formatBirthday(contact.birthday);
  birthday.setAttribute("aria-label", `Date de naissance : ${formatBirthday(contact.birthday)}`);
  const phone = document.createElement("span");
  phone.className = "contact-phone";
  phone.textContent = contact.phone || "Téléphone non renseigné";
  phone.setAttribute("aria-label", `Téléphone : ${contact.phone || "non renseigné"}`);
  metadata.append(birthday, phone);
  item.append(metadata);

  if (contact.comment?.trim()) {
    const details = document.createElement("details");
    details.className = "contact-comment";
    const summary = document.createElement("summary");
    const preview = document.createElement("span");
    preview.className = "comment-preview";
    preview.textContent = contact.comment.trim();
    summary.append(preview);
    summary.setAttribute("aria-label", `Commentaire de ${contact.name} : ${contact.comment.trim()}`);
    summary.addEventListener("click", (event) => {
      if (!details.open && !details.classList.contains("has-more")) event.preventDefault();
    });
    details.append(summary);
    item.append(details);
  }
  scheduleCommentLayout();
  return item;
}

let commentLayoutPending = false;
function scheduleCommentLayout() {
  if (commentLayoutPending) return;
  commentLayoutPending = true;
  requestAnimationFrame(() => {
    commentLayoutPending = false;
    for (const details of document.querySelectorAll(".contact-comment")) {
      if (details.open) continue;
      const preview = details.querySelector(".comment-preview");
      if (!preview.clientWidth) continue;
      const overflows = preview.scrollWidth > preview.clientWidth + 1 || preview.scrollHeight > preview.clientHeight + 1;
      details.classList.toggle("has-more", overflows);
      details.querySelector("summary").tabIndex = overflows ? 0 : -1;
    }
  });
}
// Réévaluer après redimensionnement et ouverture des accordéons mensuels.
new ResizeObserver(scheduleCommentLayout).observe(document.body);
document.addEventListener("toggle", scheduleCommentLayout, true);
