# Mobile Dashboard - Backend

API REST avec NestJS, Prisma et PostgreSQL.

## Installation

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate dev
```

## Créer un admin (seed)

```bash
npx ts-node prisma/seed.ts
```

Le seed crée un utilisateur **ADMIN**. Les inscriptions via `/api/auth/register` créent des **VIEWER**.

## Lancer

```bash
pnpm run start:dev
```

Serveur sur `http://localhost:3002`

## Variables d'environnement

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mobile-dashboard"
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
PORT=3002
VAPID_PUBLIC_KEY=<cle-publique>
VAPID_PRIVATE_KEY=<cle-privee>
VAPID_EMAIL=mailto:admin@example.com
```

## Rôles

| Rôle | Droits |
|------|--------|
| ADMIN | Voir, créer, modifier, supprimer |
| VIEWER | Voir uniquement |

## API Endpoints

### Auth (publiques)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Inscription (VIEWER) |
| POST | /api/auth/login | Connexion |

### Users (JWT requis)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | /api/users/me | Tous | Mon profil |
| GET | /api/users/list | Tous | Liste utilisateurs |
| GET | /api/users/:id/details | Tous | Détail utilisateur |
| POST | /api/users/create | ADMIN | Créer |
| PUT | /api/users/:id/update | ADMIN | Modifier |
| DELETE | /api/users/:id/delete | ADMIN | Supprimer |

### Notifications (JWT requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/notifications | 50 dernières notifications |
| GET | /api/notifications/stats | Stats par jour |
| GET | /api/notifications/count | Total et non lues |
| PATCH | /api/notifications/read | Marquer toutes comme lues |
| DELETE | /api/notifications/:id | Supprimer une notification |
| DELETE | /api/notifications | Supprimer toutes |

### Push Notifications

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /api/notifications/vapid-public-key | Non | Clé publique VAPID |
| POST | /api/notifications/push/subscribe | JWT | S'abonner |
| POST | /api/notifications/push/unsubscribe | JWT | Se désabonner |

## Fonctionnalités

- Authentification JWT (login + inscription)
- CRUD utilisateurs avec rôles (ADMIN/VIEWER)
- Notifications en temps réel (WebSocket / Socket.IO)
- Push notifications (Web Push API) même onglet fermé
- Statistiques d'activité (créations, modifications, suppressions par jour)

## Technologies

NestJS, Prisma, PostgreSQL, Passport JWT, Socket.IO, web-push, bcrypt, class-validator
