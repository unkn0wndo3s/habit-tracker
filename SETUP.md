# Configuration du système de comptes

Ce document explique comment configurer le système de comptes et la base de données PostgreSQL pour TrackIt.

## Prérequis

- Node.js installé
- PostgreSQL installé et en cours d'exécution
- npm ou yarn installé

## Configuration

### 1. Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trackit?schema=public"

# JWT Secret (générez une clé secrète aléatoire pour la production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Resend API Key (pour l'envoi d'emails)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"

# Application URL (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important** : Remplacez les valeurs suivantes :

- `user` : votre nom d'utilisateur PostgreSQL
- `password` : votre mot de passe PostgreSQL
- `trackit` : le nom de votre base de données (vous pouvez le changer)
- `JWT_SECRET` : générez une clé secrète aléatoire (par exemple avec `openssl rand -base64 32`)
- `RESEND_API_KEY` : votre clé API Resend (obtenez-la sur [resend.com](https://resend.com))
- `NEXT_PUBLIC_APP_URL` : l'URL de votre application (pour les liens dans les emails)

### 2. Créer la base de données PostgreSQL

Connectez-vous à PostgreSQL et créez la base de données :

```sql
CREATE DATABASE trackit;
```

### 3. Générer le client Prisma

Exécutez la commande suivante pour générer le client Prisma :

```bash
npx prisma generate
```

### 4. Créer les tables dans la base de données

Exécutez la migration Prisma pour créer les tables :

```bash
npx prisma migrate dev --name init
```

Ou si vous préférez créer les tables sans migration :

```bash
npx prisma db push
```

### 5. Vérifier la connexion

Vous pouvez vérifier que tout fonctionne en ouvrant Prisma Studio :

```bash
npx prisma studio
```

Cela ouvrira une interface web pour visualiser et gérer vos données.

## Utilisation

### Inscription

Pour créer un compte, faites une requête POST à `/api/auth/register` :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Connexion

Pour se connecter, faites une requête POST à `/api/auth/login` :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

La réponse contiendra un token JWT à utiliser pour les requêtes authentifiées.

### Synchronisation

L'application fonctionne en mode hybride :

- **Hors ligne** : Les habitudes sont stockées dans le localStorage
- **En ligne et connecté** : Les habitudes sont synchronisées avec la base de données PostgreSQL

Quand un utilisateur se connecte, les habitudes du localStorage sont automatiquement synchronisées avec la base de données.

## Structure de la base de données

- **User** : Table des utilisateurs (id, email, password hash, pseudo, firstName, lastName, resetToken, resetTokenExpiresAt, dates)
- **Habit** : Table des habitudes (id, userId, nom, description, jours ciblés, tags, etc.)
- **HabitCompletion** : Table des complétions (id, habitId, dateKey, completedAt)

## Fonctionnalités de compte

### Gestion du profil

Les utilisateurs peuvent :
- Modifier leur pseudo, prénom et nom via la page `/account`
- Changer leur mot de passe (avec confirmation par email)

### Récupération de mot de passe

- Les utilisateurs peuvent demander une réinitialisation via `/forgot-password`
- Un email avec un lien de réinitialisation est envoyé (valide 1 heure)
- Le lien redirige vers `/reset-password?token=...` pour définir un nouveau mot de passe

## Notes importantes

- L'application continue de fonctionner hors ligne même sans compte
- Les habitudes créées hors ligne sont synchronisées automatiquement lors de la connexion
- Le mot de passe est hashé avec bcrypt avant stockage
- Les tokens JWT expirent après 30 jours
