### Habit tracker — Document descriptif (mobile-only, mono-utilisateur)

Application mobile de suivi d’habitudes. Pour débuter, aucune fonctionnalité multi-utilisateurs. UI sans design décoratif; uniquement positions et dimensions.

### Objectifs

- **Suivre** des habitudes quotidiennes avec un planning hebdomadaire.
- **Cocher** les habitudes jour par jour et visualiser la progression.
- **Fonctionner hors-ligne** via stockage local.

### Users stories (US) et versions

#### Version 1.0 (MVP — base locale, offline)

- **US1 — Créer une habitude**: En tant qu'utilisateur, je veux créer une habitude avec un nom, une description optionnelle et des jours de la semaine ciblés afin d'organiser ma routine.
  - **Critères d'acceptance**:
    - Je peux saisir un nom d'habitude (obligatoire, max 50 caractères)
    - Je peux ajouter une description optionnelle (max 200 caractères)
    - Je peux sélectionner un ou plusieurs jours de la semaine
    - L'habitude est sauvegardée en local et apparaît dans ma liste
    - Un message de confirmation s'affiche à la création
- **US2 — Lister les habitudes du jour**: En tant qu'utilisateur, je veux voir la liste des habitudes planifiées pour la date sélectionnée afin de savoir quoi faire aujourd'hui.
  - **Critères d'acceptance**:
    - Je vois toutes les habitudes programmées pour le jour sélectionné
    - Chaque habitude affiche son nom, description et statut (réalisée/non réalisée)
    - Les habitudes sont triées par ordre de création
    - Si aucune habitude n'est programmée, un message informatif s'affiche
    - La date actuelle est clairement indiquée
- **US3 — Marquer une habitude comme réalisée**: En tant qu'utilisateur, je veux cocher/décocher une habitude pour la date du jour afin d'enregistrer ma progression.
  - **Critères d'acceptance**:
    - Je peux cliquer sur une case à cocher pour marquer une habitude comme réalisée
    - Je peux décocher pour annuler la réalisation
    - Le changement est immédiatement sauvegardé en local
    - L'état visuel change instantanément (coche/barre/indicateur)
    - L'action fonctionne pour n'importe quel jour sélectionné
- **US4 — Naviguer par jour**: En tant qu'utilisateur, je veux passer au jour précédent/suivant et revenir à aujourd'hui afin de consulter/mettre à jour d'autres dates.
  - **Critères d'acceptance**:
    - Je peux cliquer sur des boutons "←" et "→" pour naviguer jour par jour
    - Je peux cliquer sur "Aujourd'hui" pour revenir à la date actuelle
    - La date affichée change et la liste des habitudes se met à jour
    - La navigation fonctionne dans les deux sens (passé/futur)
    - La date est clairement affichée (format: "Lundi 15 janvier 2024")
- **US5 — Modifier une habitude**: En tant qu'utilisateur, je veux modifier le nom, la description et le planning d'une habitude afin de l'ajuster.
  - **Critères d'acceptance**:
    - Je peux cliquer sur un bouton "Modifier" ou "Éditer" sur une habitude
    - Un formulaire s'ouvre avec les données actuelles pré-remplies
    - Je peux modifier le nom, la description et les jours de la semaine
    - Je peux sauvegarder ou annuler les modifications
    - Les changements sont immédiatement reflétés dans la liste
    - Un message de confirmation s'affiche à la sauvegarde
- **US6 — Supprimer une habitude**: En tant qu'utilisateur, je veux supprimer une habitude afin d'épurer ma liste.
  - **Critères d'acceptance**:
    - Je peux cliquer sur un bouton "Supprimer" ou "🗑️" sur une habitude
    - Une confirmation s'affiche avant la suppression définitive
    - Je peux confirmer ou annuler la suppression
    - L'habitude disparaît immédiatement de la liste
    - L'historique de progression de cette habitude est également supprimé
    - Un message de confirmation s'affiche après suppression

#### Version 1.1 (feedback & progression)

- **U7 — Vue 7 jours**: En tant qu'utilisateur, je veux voir l'état des 7 derniers jours par habitude afin d'avoir un aperçu de ma régularité.
  - **Critères d'acceptance**:
    - Je peux accéder à une vue "7 jours" pour chaque habitude
    - Chaque jour affiche un indicateur visuel (✓, ✗, ou -)
    - Les 7 derniers jours sont affichés chronologiquement
    - Je peux voir d'un coup d'œil ma régularité sur la semaine
    - La vue est accessible depuis la liste des habitudes
- **US8 — Séries (streaks)**: En tant qu'utilisateur, je veux voir la longueur actuelle de ma série pour chaque habitude afin de me motiver.
  - **Critères d'acceptance**:
    - Chaque habitude affiche sa série actuelle (ex: "5 jours")
    - La série se calcule automatiquement en comptant les jours consécutifs
    - La série se remet à zéro si j'oublie un jour programmé
    - L'affichage est visible dans la liste principale des habitudes
    - Un indicateur visuel (badge, couleur) met en valeur les bonnes séries
- **US9 — Annulation rapide**: En tant qu'utilisateur, je veux pouvoir annuler la dernière action (ex: suppression) afin de corriger une erreur.
  - **Critères d'acceptance**:
    - Un bouton "Annuler" ou "↶" apparaît après chaque action destructrice
    - Je peux annuler dans les 5 secondes suivant l'action
    - L'annulation restaure l'état précédent (habitude restaurée, modification annulée)
    - Le bouton disparaît automatiquement après 5 secondes
    - Un message confirme l'annulation de l'action

#### Version 1.2 (organisation & gestion)

- **US10 — Tags & filtrage**: En tant qu'utilisateur, je veux taguer mes habitudes et filtrer par tag afin d'organiser mes routines.
  - **Critères d'acceptance**:
    - Je peux ajouter des tags à une habitude lors de sa création/modification
    - Je peux créer de nouveaux tags ou utiliser des tags existants
    - Je peux filtrer la liste des habitudes par tag sélectionné
    - Un compteur indique le nombre d'habitudes par tag
    - Je peux voir tous les tags utilisés dans une section dédiée
    - Le filtre "Tous" affiche toutes les habitudes
- **US11 — Recherche**: En tant qu'utilisateur, je veux rechercher une habitude par nom afin de la retrouver rapidement.
  - **Critères d'acceptance**:
    - Un champ de recherche est disponible en haut de la liste
    - La recherche fonctionne en temps réel pendant que je tape
    - La recherche est insensible à la casse (majuscules/minuscules)
    - Les résultats incluent le nom et la description des habitudes
    - Si aucun résultat, un message "Aucune habitude trouvée" s'affiche
    - Je peux effacer la recherche pour voir toutes les habitudes
- **US12 — Archiver / Réactiver**: En tant qu'utilisateur, je veux archiver des habitudes sans les supprimer, puis les réactiver si besoin.
  - **Critères d'acceptance**:
    - Je peux cliquer sur "Archiver" pour masquer une habitude
    - Les habitudes archivées n'apparaissent plus dans la liste principale
    - Une section "Archivées" permet de voir les habitudes archivées
    - Je peux cliquer sur "Réactiver" pour remettre une habitude en activité
    - L'historique de progression est conservé lors de l'archivage
    - Un indicateur visuel distingue les habitudes archivées
- **US13 — Dupliquer**: En tant qu'utilisateur, je veux dupliquer une habitude existante afin de gagner du temps.
  - **Critères d'acceptance**:
    - Je peux cliquer sur "Dupliquer" sur une habitude existante
    - Un formulaire s'ouvre avec toutes les données pré-remplies
    - Le nom est automatiquement préfixé par "Copie de" ou suffixé par " (2)"
    - Je peux modifier les données avant de sauvegarder
    - La nouvelle habitude est créée avec un statut "non réalisée" pour tous les jours
    - Un message confirme la duplication réussie
- **US14 — Sauvegarde et transfert**: En tant qu'utilisateur, je veux créer un fichier de sauvegarde contenant mes habitudes afin de les transférer vers un autre appareil.
  - **Critères d'acceptance**:
    - Je peux cliquer sur "Exporter" pour télécharger un fichier de sauvegarde
    - Le fichier contient toutes mes habitudes, leur configuration et leur historique
    - Je peux transférer ce fichier vers un autre appareil (email, cloud, etc.)
    - Je peux cliquer sur "Importer" pour charger un fichier de sauvegarde
    - L'import remplace complètement les données existantes sur le nouvel appareil
    - Une confirmation s'affiche avant l'import pour éviter les erreurs
    - Un message indique le succès/échec de l'opération

#### Version 1.3 (PWA & notifications locales)

- **US15 — Installation PWA**: En tant qu'utilisateur, je veux installer l'app sur mon écran d'accueil afin d'y accéder rapidement.
  - **Critères d'acceptance**:
    - Un bouton "Installer l'app" apparaît dans le navigateur
    - L'installation ajoute une icône sur l'écran d'accueil
    - L'app s'ouvre en plein écran sans barre d'adresse
    - L'app fonctionne hors ligne après installation
    - L'icône et le nom de l'app sont personnalisés
    - L'app se met à jour automatiquement quand je suis en ligne
- **US16 — Notifications locales**: En tant qu'utilisateur, je veux recevoir des rappels locaux pour les habitudes planifiées afin de ne pas oublier.
  - **Critères d'acceptance**:
    - Je peux activer/désactiver les notifications dans les paramètres
    - Je peux définir l'heure des rappels pour chaque habitude
    - Les notifications s'affichent même si l'app est fermée
    - La notification indique le nom de l'habitude à réaliser
    - Je peux cliquer sur la notification pour ouvrir l'app
    - Les notifications ne s'affichent que pour les habitudes non réalisées
- **US17 — Statistiques simples**: En tant qu'utilisateur, je veux voir un taux de complétion mensuel et une heatmap simple afin de mesurer mes progrès.
  - **Critères d'acceptance**:
    - Je peux accéder à une section "Statistiques" dans l'app
    - Le taux de complétion mensuel s'affiche en pourcentage
    - Une heatmap montre l'activité des 30 derniers jours
    - Chaque jour est coloré selon le nombre d'habitudes réalisées
    - Je peux voir les statistiques par habitude individuelle
    - Les données sont calculées en temps réel

### Ordonnancement de développement (proposé)

- **v1.0**: US1 → US2 → US3 → US4 → US7 → US5 → US6
- **v1.1**: US7 → US8 → US9
- **v1.2**: US10 → US11 → US12 → US13 → US14
- **v1.3**: US15 → US16 → US17

### Pré-requis techniques

- Next.js + TypeScript, mobile-only (largeur max ~480px), stockage local (`localStorage`), aucune dépendance multi-utilisateurs au départ.

### Remarques

- Les US de la v2.0 (multi-utilisateur) sont explicitement écartées du périmètre initial.
