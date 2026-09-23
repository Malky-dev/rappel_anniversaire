# Rappel anniversaire

Extension de navigateur destinée à Mozilla Firefox et Google Chrome pour enregistrer des anniversaires et afficher des rappels.

## Fonctionnalités prévues

Chaque fiche comportera :

- un nom ;
- une date au format JJ/MM/AAAA ;
- un numéro de téléphone ;
- un commentaire.

Lorsque le jour et le mois correspondent à la date du jour, l’extension ouvrira un onglet présentant les informations concernées et affichera une notification toutes les deux heures pendant cette journée.

## État du projet

Initialisation du dépôt. L’extension n’est pas encore implémentée.

Les modalités de stockage, les autorisations navigateur, le comportement au redémarrage et le traitement du 29 février seront précisés lors de la conception.

Ne pas ajouter de données personnelles réelles au dépôt public.

## Organisation Git

- `main` : production ; reçoit uniquement les changements provenant de `develop` après initialisation.
- `develop` : intégration et tests.
- Branches de travail préfixées selon leur objet : `feature/`, `bugfix/`, `fix/`, `chore/`.
- Séparateur de mots dans les noms de branches : `_`.
- Messages de commit sous la forme `type(scope): description`, avec moins de 15 mots.

## Encodage

Les fichiers texte sont enregistrés en UTF-8.
