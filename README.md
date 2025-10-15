### Habit tracker — Document descriptif (mobile-only, mono-utilisateur)

Application mobile de suivi d’habitudes. Pour débuter, aucune fonctionnalité multi-utilisateurs. UI sans design décoratif; uniquement positions et dimensions.

### Objectifs

- **Suivre** des habitudes quotidiennes avec un planning hebdomadaire.
- **Cocher** les habitudes jour par jour et visualiser la progression.
- **Fonctionner hors-ligne** via stockage local.

### Users stories (US) et versions

#### Version 1.0 (MVP — base locale, offline)

- **US1 — Créer une habitude**: En tant qu’utilisateur, je veux créer une habitude avec un nom, une description optionnelle et des jours de la semaine ciblés afin d’organiser ma routine.
- **US2 — Lister les habitudes du jour**: En tant qu’utilisateur, je veux voir la liste des habitudes planifiées pour la date sélectionnée afin de savoir quoi faire aujourd’hui.
- **US3 — Marquer une habitude comme réalisée**: En tant qu’utilisateur, je veux cocher/décocher une habitude pour la date du jour afin d’enregistrer ma progression.
- **US4 — Naviguer par jour**: En tant qu’utilisateur, je veux passer au jour précédent/suivant et revenir à aujourd’hui afin de consulter/mettre à jour d’autres dates.
- **US5 — Modifier une habitude**: En tant qu’utilisateur, je veux modifier le nom, la description et le planning d’une habitude afin de l’ajuster.
- **US6 — Supprimer une habitude**: En tant qu’utilisateur, je veux supprimer une habitude afin d’épurer ma liste.
- **US7 — Persistance locale**: En tant qu’utilisateur, je veux que mes données soient conservées en local (localStorage) afin de retrouver mes habitudes sans compte.
- **US8 — Interface mobile**: En tant qu’utilisateur, je veux une UI utilisable sur smartphone (largeur max ~480px, barre d’action basse) afin d’interagir facilement.

#### Version 1.1 (feedback & progression)

- **US9 — Vue 7 jours**: En tant qu’utilisateur, je veux voir l’état des 7 derniers jours par habitude afin d’avoir un aperçu de ma régularité.
- **US10 — Séries (streaks)**: En tant qu’utilisateur, je veux voir la longueur actuelle de ma série pour chaque habitude afin de me motiver.
- **US11 — Confirmation de suppression**: En tant qu’utilisateur, je veux confirmer la suppression d’une habitude afin d’éviter les erreurs.
- **US12 — Annulation rapide**: En tant qu’utilisateur, je veux pouvoir annuler la dernière action (ex: suppression) afin de corriger une erreur.

#### Version 1.2 (organisation & gestion)

- **US13 — Tags & filtrage**: En tant qu’utilisateur, je veux taguer mes habitudes et filtrer par tag afin d’organiser mes routines.
- **US14 — Recherche**: En tant qu’utilisateur, je veux rechercher une habitude par nom afin de la retrouver rapidement.
- **US15 — Archiver / Réactiver**: En tant qu’utilisateur, je veux archiver des habitudes sans les supprimer, puis les réactiver si besoin.
- **US16 — Dupliquer**: En tant qu’utilisateur, je veux dupliquer une habitude existante afin de gagner du temps.
- **US17 — Import / Export JSON**: En tant qu’utilisateur, je veux exporter/importer mes données afin de sauvegarder/restaurer mon suivi.

#### Version 1.3 (PWA & notifications locales)

- **US18 — Installation PWA**: En tant qu’utilisateur, je veux installer l’app sur mon écran d’accueil afin d’y accéder rapidement.
- **US19 — Cache offline**: En tant qu’utilisateur, je veux que l’app fonctionne hors connexion afin de cocher mes habitudes sans réseau.
- **US20 — Notifications locales**: En tant qu’utilisateur, je veux recevoir des rappels locaux pour les habitudes planifiées afin de ne pas oublier.
- **US21 — Statistiques simples**: En tant qu’utilisateur, je veux voir un taux de complétion mensuel et une heatmap simple afin de mesurer mes progrès.

#### Version 2.0 (future — multi-utilisateur & synchro, hors périmètre initial)

- Authentification, synchronisation cloud, partage/communautés. Non planifié pour le démarrage.

### Ordonnancement de développement (proposé)

- **v1.0**: US1 → US2 → US3 → US4 → US7 → US5 → US6 → US8
- **v1.1**: US9 → US10 → US11 → US12
- **v1.2**: US13 → US14 → US15 → US16 → US17
- **v1.3**: US18 → US19 → US20 → US21

### Workflow Git (branches & merges)

- **Branches de version**: `version/v1.0`, `version/v1.1`, `version/v1.2`, `version/v1.3`
- **Branches de fonctionnalité (US)**: `feature/creer-habitude`, `feature/lister-habitudes`, `feature/marquer-jour`, `feature/navigation-jours`, `feature/persistance-locale`, `feature/editer-habitude`, `feature/supprimer-habitude`, `feature/ui-mobile`, etc.
- **Processus**:
  - Partir de `main`, créer `version/v1.0`.
  - Pour chaque US de v1.0, créer une branche `feature/...` depuis `version/v1.0`, implémenter, ouvrir une PR et merger dans `version/v1.0`.
  - Quand toutes les US de v1.0 sont mergées, merger `version/v1.0` → `main` et taguer `v1.0.0`.
  - Répéter pour `version/v1.1`, etc.

### Mapping US ↔ branches (exemples)

- US1 → `feature/creer-habitude`
- US2 → `feature/lister-habitudes`
- US3 → `feature/marquer-jour`
- US4 → `feature/navigation-jours`
- US5 → `feature/editer-habitude`
- US6 → `feature/supprimer-habitude`
- US7 → `feature/persistance-locale`
- US8 → `feature/ui-mobile`

### Pré-requis techniques

- Next.js + TypeScript, mobile-only (largeur max ~480px), stockage local (`localStorage`), aucune dépendance multi-utilisateurs au départ.

### Remarques

- Les US de la v2.0 (multi-utilisateur) sont explicitement écartées du périmètre initial.
