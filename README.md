# TrackIt - Next.js SSG Project

Un projet Next.js avec TypeScript configuré pour la génération de site statique (SSG) et intégré avec shadcn/ui.

## 🚀 Fonctionnalités

- **Next.js 15** avec App Router
- **TypeScript** pour un développement type-safe
- **Static Site Generation (SSG)** pour des performances optimales
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **SEO optimisé** avec des métadonnées

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🛠️ Scripts disponibles

```bash
# Développement
npm run dev

# Build pour la production
npm run build

# Export statique (SSG)
npm run export

# Linter
npm run lint
```

## 🏗️ Configuration SSG

Le projet est configuré pour la génération de site statique avec :

- `output: 'export'` dans `next.config.ts`
- `trailingSlash: true` pour la compatibilité avec les serveurs statiques
- `images: { unoptimized: true }` pour l'export statique

## 📁 Structure du projet

```
src/
├── app/
│   ├── globals.css      # Styles globaux Tailwind
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Page d'accueil
├── components/          # Composants réutilisables
└── lib/                 # Utilitaires et configurations
```

## 🎨 shadcn/ui

Le projet est configuré avec shadcn/ui via MCP. Pour ajouter de nouveaux composants :

```bash
npx shadcn@latest add [component-name]
```

## 🚀 Déploiement

### Export statique

```bash
npm run build
```

Les fichiers statiques seront générés dans le dossier `out/`.

### Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

## 📝 Développement

1. Modifiez `src/app/page.tsx` pour personnaliser la page d'accueil
2. Ajoutez de nouveaux composants dans `src/components/`
3. Utilisez `npm run dev` pour voir les changements en temps réel

## 🔧 Configuration

- **TypeScript** : Configuration dans `tsconfig.json`
- **Tailwind** : Configuration dans `tailwind.config.ts`
- **ESLint** : Configuration dans `eslint.config.mjs`
- **Next.js** : Configuration dans `next.config.ts`
