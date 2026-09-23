# Développement et vérifications

## Architecture

- `manifest.json` : permissions, icônes et points d’entrée.
- `popup.html` et `popup.js` : navigation, import et export.
- `form.html` et `form.js` : création et modification.
- `registry.html` et `registry.js` : affichage, recherche, suppression et outils de test.
- `contact-store.js` : accès aux fiches, une clé `contact:<id>` par personne.
- `contacts.js` : validation et présentation des dates.
- `registry-view.js` : recherche, classement et regroupement mensuel.
- `birthdays.js` : comparaison du jour et du mois selon la date locale.
- `reminder-policy.js` : calcul de la prochaine heure paire et des suspensions.
- `background.js` : événements du navigateur, alarmes et notifications.
- `reminder.html` et `reminder.js` : fenêtre regroupant les anniversaires.
- `transfer.js` : validation des sauvegardes avant import.

Chrome utilise un service worker ; Firefox utilise des scripts d’arrière-plan. Le manifeste source décrit les deux. Les archives produites par `tools/build.ps1` possèdent chacune un manifeste adapté.

## Tests automatisés

Depuis la racine, avec Node.js :

```powershell
node --test tests/*.test.cjs
```

Les tests utilisent un stockage et des événements navigateur simulés. Ils couvrent les règles métier ; ils ne prouvent pas l’affichage dans un vrai navigateur.

## Essais manuels dans Firefox et Chrome

Après une modification du manifeste, recharger l’extension depuis sa page de gestion, fermer les anciens onglets et les rouvrir depuis son icône. Ne pas désinstaller l’extension pour la recharger : la désinstallation peut effacer les fiches.

1. Ajouter une fiche, fermer puis rouvrir le registre et vérifier sa persistance.
2. Modifier la fiche, vérifier l’absence de doublon, annuler puis confirmer une suppression.
3. Vérifier les accordéons et la recherche sans accents.
4. Ajouter des contacts fictifs avec la date du jour dans un profil de test.
5. Quitter complètement puis relancer le navigateur : une seule fenêtre doit regrouper les anniversaires.
6. Vérifier « Plus tard » à la prochaine heure paire et « Ignorer aujourd’hui » jusqu’au lendemain, y compris après redémarrage.
7. Vérifier le rattrapage au retour de veille.
8. Exporter depuis la popup, puis importer dans un autre profil de test. Vérifier accents, commentaires et téléphones.
9. Importer deux fois : les mêmes identifiants sont remplacés après confirmation, pas dupliqués. Un JSON invalide doit être refusé sans modification des fiches.

Les fixtures des tests automatisés restent dans `tests/fixtures`, hors des archives distribuées. À la mise à jour, les 100 identifiants de démonstration de l’ancienne version sont supprimés du stockage ; les contacts manuels sont conservés.

Le calendrier natif, les fenêtres, le téléchargement et les permissions doivent être testés dans les deux navigateurs.

## Sauvegardes

JSON UTF-8 avec `schemaVersion: 1` et tableau `contacts`. Chaque fiche contient `id`, `name`, `birthday` (AAAA-MM-JJ), `phone` et `comment`. Maximum : 10 000 fiches et 5 Mo à l’import. Les champs sont validés avant toute écriture. Les noms identiques avec des identifiants différents restent des fiches différentes. Les fichiers ne sont pas chiffrés.

## Rappels

La date et les heures sont celles de l’ordinateur. Le 29 février correspond uniquement au 29 février. Les boutons concernent tous les anniversaires du jour. Fermer la fenêtre avec la croix ne suspend pas les rappels suivants. Une alarme manquée est traitée quand le navigateur reprend, puis la prochaine heure paire est recalculée. Aucune notification n’est émise navigateur complètement fermé.

## Construire les archives

```powershell
./tools/build.ps1
```

Chaque construction crée un nouveau dossier daté sous `dist/`, sans supprimer les précédents. Les ZIP sont des paquets non signés, pas des versions publiées dans les boutiques. Firefox exige une signature Mozilla pour une installation permanente standard.

Références : [arrière-plan mult navigateur](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background), [alarmes Chrome](https://developer.chrome.com/docs/extensions/reference/api/alarms).
