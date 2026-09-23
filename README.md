<div align="center">

# 🌿 Rappel anniversaire

### *Les années passent. Les liens demeurent.*

**Un registre pour vos proches, un rappel pour leurs jours de fête.**

Extension pour **Mozilla Firefox** et **Google Chrome** — version **1.0.0**.

</div>

---

## 🕯️ Pour que nul compagnon ne soit oublié

Les chemins s’allongent, les saisons se succèdent, et les compagnons d’autrefois habitent parfois bien loin de notre porte.

Il reste pourtant des jours où un simple message suffit à réduire la distance.

**Rappel anniversaire** conserve vos dates importantes et rassemble les informations nécessaires pour un appel, quelques mots ou une invitation à partager un bon repas.

> **L’aventure se poursuit.**
> Les fonctionnalités ont été validées manuellement par le propriétaire du projet. L’extension n’est pas publiée dans les boutiques des navigateurs.

## 📖 Le livre des compagnons

Même un roi mérite qu’on pense à son anniversaire.

| Champ | Exemple |
|---|---|
| **Nom** | Aragorn, fils d’Arathorn |
| **Date de naissance** | `01/03/2931` — Troisième Âge |
| **Téléphone** | `06 XX XX XX XX` — les palantíri captent assez mal |
| **Commentaire** | Prévoir un banquet avec Arwen. Éviter les bougies : le gâteau manque de place. |

Ajoutez, modifiez ou supprimez vos fiches. Le registre les regroupe dans des accordéons mensuels, puis par jour. La recherche porte sur les noms, téléphones et commentaires, sans distinction de casse ni d’accents.

## 🔔 Lorsque revient le jour de fête

L’extension compare le **jour et le mois** des fiches à la date locale. Au démarrage du navigateur et aux **heures paires**, elle ouvre une fenêtre regroupant tous les anniversaires du jour et demande une notification système. Une fenêtre déjà ouverte est réutilisée.

- **Ignorer aujourd’hui** suspend les rappels jusqu’au lendemain, même après redémarrage.
- **Plus tard** reporte le rappel à la prochaine heure paire, même après redémarrage.
- Aucun anniversaire : aucun rappel.

Les alarmes peuvent être retardées par le navigateur, notamment pendant la veille. Au retour, un rappel manqué est traité pour la journée courante. Le navigateur doit fonctionner pour déclencher les rappels. Les anniversaires du **29 février** sont signalés uniquement les années bissextiles.

De quoi penser aux bougies avant d’entamer le second petit déjeuner.

## 🗝️ Un registre gardé chez vous

Vous renseignez vos fiches, conservées **localement dans votre profil de navigateur** grâce à `storage.local`. Aucun serveur ne centralise ces informations et aucune donnée personnelle n’est envoyée vers GitHub.

Les profils de navigateur possèdent des registres indépendants. Les personnes utilisant **le même profil** ont accès aux mêmes fiches.

### Conserver les écrits

Chaque enregistrement et suppression confirmé est sauvegardé. Les fiches restent présentes après fermeture du navigateur ou redémarrage de l’ordinateur. Désinstaller l’extension ou supprimer le profil peut les effacer.

### 📦 Exporter pour le voyage

Le bouton **Exporter**, dans la popup, télécharge vos fiches dans un fichier JSON UTF-8. Il permet une sauvegarde manuelle ou un transfert entre navigateurs et ordinateurs. Les suspensions de rappel ne sont pas exportées.

### 📥 Retrouver son registre

Le bouton **Importer**, dans la popup, ouvre un fichier JSON et vérifie toutes ses fiches avant enregistrement. Une confirmation indique les ajouts et remplacements : un identifiant existant est remplacé, les autres fiches sont conservées. Deux noms identiques avec des identifiants différents restent distincts.

Limites d’import : **5 Mo et 10 000 fiches**. Aucune synchronisation automatique entre appareils.

> **Toutes les archives ne sont pas scellées.**
> Le fichier exporté contient les données personnelles en clair, sans chiffrement. Conservez-le dans un emplacement sûr.

## 🚪 Avant de quitter le foyer

**Chrome 121 ou ultérieur** : ouvrir `chrome://extensions`, activer le mode développeur, puis « Charger l’extension non empaquetée » et sélectionner le dossier `extension`.

**Firefox 142 ou ultérieur** : ouvrir `about:debugging`, puis « Ce Firefox » et « Charger un module complémentaire temporaire ». Sélectionner `extension/manifest.json`. Ce chargement est temporaire ; une installation permanente nécessite la signature Mozilla.

Après une mise à jour, recharger l’extension et rouvrir ses pages. Les permissions demandées servent au **stockage**, aux **alarmes** et aux **notifications**.


Les explications du code, les commandes de test et la préparation des archives sont dans le [guide de développement](docs/DEVELOPPEMENT.md).

---

<div align="center">

*« Elen síla lúmenn’ omentielvo. »*

**« Une étoile brille sur l’heure de notre rencontre. »**

— J. R. R. Tolkien, *La Communauté de l’Anneau*

</div>
