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

### Créer le premier utilisateur (seed)

Le projet n'a pas de route publique d'inscription. Le premier utilisateur est créé via un script interactif dans le terminal :

```bash
npx ts-node prisma/seed.ts
```

Le terminal vous demandera de saisir :

```
--- Create a new user ---

Name: Admin
Email: admin@gmail.com
Password: admin123

User created: Admin (admin@gmail.com)
```

Vous pouvez ensuite vous connecter avec ces identifiants via `POST /api/auth/login`.

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
| POST    | /api/users/create        | JWT  | Creer un utilisateur     |
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

## WebSocket - Notifications en temps reel

Le backend utilise **Socket.IO** via `@nestjs/websockets` pour envoyer des notifications en temps reel a tous les clients connectes.

### Architecture

```
Client (navigateur)  <--WebSocket-->  NestJS Gateway  <--Prisma-->  PostgreSQL
```

### Flux

1. Un admin cree/modifie/supprime un utilisateur via l'API REST
2. Le `UsersService` appelle `NotificationsGateway.notifyUserCreated/Updated/Deleted()`
3. Le gateway sauvegarde la notification en base de donnees et emet l'evenement WebSocket
4. Tous les clients connectes recoivent l'evenement en temps reel

### Evenements WebSocket emis

| Evenement | Declencheur | Donnees |
|---|---|---|
| `user:created` | Creation d'un utilisateur | `{ id, name, email, createdAt, updatedAt }` |
| `user:updated` | Modification d'un utilisateur | `{ id, name, email, createdAt, updatedAt }` |
| `user:deleted` | Suppression d'un utilisateur | `{ id }` |

### Endpoints REST des notifications

| Methode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | Liste des 50 dernieres notifications |
| PATCH | `/api/notifications/read` | JWT | Marquer toutes les notifications comme lues |

### Fichiers concernes

| Fichier | Role |
|---|---|
| `src/modules/notifications/notifications.gateway.ts` | Gateway WebSocket : connexions + emission des evenements |
| `src/modules/notifications/notifications.controller.ts` | Controller REST pour lire et marquer les notifications |
| `src/modules/notifications/notifications.module.ts` | Module NestJS (global) |
| `src/modules/users/users.service.ts` | Appelle le gateway apres chaque create/update/delete |

### Schema Prisma (Notification)

```prisma
model Notification {
  id        String   @id @default(uuid())
  type      String       // "user:created", "user:updated", "user:deleted"
  message   String
  read      Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

### Verifier la connexion

Dans la console du backend :

```
Client connected: abc123        # un client se connecte
Client disconnected: abc123     # un client se deconnecte
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
    ├── notifications/
    │   ├── notifications.module.ts
    │   ├── notifications.gateway.ts
    │   └── notifications.controller.ts
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
- Socket.IO / @nestjs/websockets
- bcrypt
- class-validator
