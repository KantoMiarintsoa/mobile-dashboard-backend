# Mobile Dashboard - Backend

Backend API REST avec NestJS, Prisma et PostgreSQL, organisé en **architecture modulaire**.

## Architecture par module

Le projet suit l'architecture modulaire de NestJS. Chaque fonctionnalité est isolée dans son propre module avec ses controllers, services et DTOs :

- **PrismaModule** (global) : Gère la connexion à la base de données via Prisma ORM. Injecté globalement dans tous les modules.
- **AuthModule** : Gère l'authentification (login) avec JWT et Passport. Contient la stratégie JWT et le guard de protection des routes.
- **UsersModule** : Gère le CRUD des utilisateurs (register, profil, liste, modification, suppression).

Chaque module est indépendant et peut être ajouté/retiré facilement dans `app.module.ts` :

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

## Prérequis

- Node.js >= 18
- pnpm
- PostgreSQL

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd mobile-dashboard-back

# Installer les dépendances
pnpm install
```

## Configuration

1. Copier le fichier d'environnement :

```bash
cp .env.example .env
```

2. Modifier le fichier `.env` avec vos valeurs :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database-name"
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
PORT=3002
```

## Base de données

### Créer la base de données PostgreSQL

```sql
CREATE DATABASE "mobile-dashboard";
```

### Appliquer les migrations Prisma

```bash
# Générer le client Prisma
pnpm prisma generate

# Appliquer les migrations
pnpm prisma migrate dev

# (Optionnel) Visualiser la base dans Prisma Studio
pnpm prisma studio
```

## Lancer le serveur

```bash
# Mode développement (watch)
pnpm run start:dev

# Mode production
pnpm run build
pnpm run start:prod
```

Le serveur démarre sur `http://localhost:3002`

## API Endpoints

### Auth

| Méthode | Route              | Auth | Description                     |
|---------|--------------------|------|---------------------------------|
| POST    | /api/auth/login    | Non  | Connexion (retourne un token)   |

### Users

| Méthode | Route                    | Auth | Description              |
|---------|--------------------------|------|--------------------------|
| POST    | /api/users/register      | Non  | Inscription              |
| GET     | /api/users/me            | JWT  | Mon profil               |
| GET     | /api/users/list          | JWT  | Liste des utilisateurs   |
| GET     | /api/users/:id/details   | JWT  | Détails d'un utilisateur |
| PUT     | /api/users/:id/update    | JWT  | Modifier un utilisateur  |
| DELETE  | /api/users/:id/delete    | JWT  | Supprimer un utilisateur |

### Exemples de requêtes

**Register :**
```bash
curl -X POST http://localhost:3002/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Kanto", "email": "kanto@test.com", "password": "123456"}'
```

**Login :**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "kanto@test.com", "password": "123456"}'
```

**Requête protégée (avec token) :**
```bash
curl http://localhost:3002/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

## Structure du projet

```
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   ├── guards/
    │   └── strategies/
    └── users/
        ├── users.module.ts
        ├── users.controller.ts
        ├── users.service.ts
        └── dto/
```

## Technologies

- NestJS
- Prisma ORM
- PostgreSQL
- Passport JWT
- bcrypt
- class-validator
