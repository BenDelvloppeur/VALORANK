# Valorank — Plateforme de coaching Valorant

Mini SaaS prêt à monétiser, qui met en relation des **coachs Valorant** et des **joueurs** :
réservation, paiement (mock Stripe), reviews, chat temps réel et console admin.

```
┌──────────────┐   JWT Bearer   ┌──────────────┐
│  Next.js 15  │ ─────────────► │  Express API │
│  (frontend)  │ ◄───────────── │  + Prisma    │
└──────┬───────┘                 └──────┬───────┘
       │                                 │
       │  Supabase Auth + Realtime       │  Postgres
       └────────────────────────────────►│  (Supabase)
```

## Stack

| Couche       | Choix                                                          |
| ------------ | -------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router), TypeScript, Tailwind, Framer Motion   |
| State        | TanStack React Query (server) + Zustand (UI/filtres)           |
| Backend      | Express 4 (TypeScript), architecture modulaire                  |
| ORM / DB     | Prisma + PostgreSQL (hébergé sur Supabase)                     |
| Auth         | Supabase Auth (JWT vérifié côté backend via `jose`)            |
| Realtime     | Supabase Realtime (chat par réservation)                       |
| Paiement     | Stripe **mock** (composant checkout simulé)                    |
| Validation   | Zod (frontend + backend)                                        |

## Architecture du repo

```
valorank/
├── backend/            # Express API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── server.ts
│       ├── config/, lib/, middleware/, utils/
│       └── modules/    # auth, coaches, availabilities, bookings, reviews, messages, admin
└── frontend/           # Next.js
    ├── app/            # routes (App Router)
    ├── components/     # UI, providers, layout, coach, booking, chat, dashboard, reviews
    ├── lib/            # api/, supabase/, stores/, utils/
    └── types/
```

Chaque module backend isole `routes` + logique métier, avec validation Zod en entrée et le wrapper
`asyncHandler` pour propager proprement les erreurs vers le `errorHandler` central.

## Mise en route

### 1. Préparer Supabase

1. Crée un projet sur https://supabase.com
2. Récupère dans **Settings → API** :
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (à garder côté serveur uniquement)
   - `SUPABASE_JWT_SECRET`
3. Récupère la `DATABASE_URL` Postgres dans **Settings → Database → Connection string**
4. (Bonus chat) **Database → Replication** → ajoute la table `Message` à la publication `supabase_realtime`

### 2. Backend

```bash
cd backend
cp .env.example .env        # remplis les valeurs Supabase
npm install
npx prisma migrate dev --name init
npm run seed                # crée 6 coachs de démo + 1 admin
npm run dev                 # http://localhost:4000
```

Le compte admin de démo est `admin@valorank.gg` (à créer côté Supabase Auth avec le même email
pour pouvoir se connecter — le `seed.ts` crée seulement la ligne applicative).

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local  # remplis NEXT_PUBLIC_*
npm install
npm run dev                 # http://localhost:3000
```

## Endpoints API (résumé)

| Méthode | Route                               | Auth          | Description                          |
| ------- | ----------------------------------- | ------------- | ------------------------------------ |
| GET     | `/health`                           | —             | Healthcheck                          |
| POST    | `/auth/sync`                        | Bearer        | Crée le profil après sign-up         |
| GET     | `/auth/me`                          | Bearer        | Profil courant                       |
| GET     | `/coaches`                          | —             | Listing avec filtres & tri           |
| GET     | `/coaches/:id`                      | —             | Profil détaillé                      |
| PUT     | `/coaches/me`                       | COACH         | Mise à jour profil coach             |
| GET     | `/availabilities/me`                | COACH         | Mes créneaux                         |
| POST    | `/availabilities`                   | COACH         | Créer un créneau                     |
| DELETE  | `/availabilities/:id`               | COACH         | Supprimer un créneau                 |
| POST    | `/bookings`                         | Bearer        | Réserver un créneau (transaction)    |
| GET     | `/bookings/me`                      | Bearer        | Mes réservations (client + coach)    |
| GET     | `/bookings/:id`                     | Participants  | Détail                               |
| PATCH   | `/bookings/:id/status`              | Participants  | Changement de statut                 |
| POST    | `/bookings/:id/pay`                 | Client        | Paiement mock                        |
| POST    | `/reviews`                          | Client        | Avis (1 par booking COMPLETED)       |
| GET     | `/reviews/coach/:coachId`           | —             | Avis d’un coach                      |
| GET     | `/messages/:bookingId`              | Participants  | Historique chat                      |
| POST    | `/messages/:bookingId`              | Participants  | Envoi message (déclenche Realtime)   |
| GET     | `/admin/users`                      | ADMIN         | Liste tous les users                 |
| PATCH   | `/admin/users/:id/role`             | ADMIN         | Change le rôle                       |
| DELETE  | `/admin/coaches/:id`                | ADMIN         | Supprime un coach                    |
| GET     | `/admin/stats`                      | ADMIN         | KPIs globaux                         |

## Pages frontend

- `/` : landing avec top coachs
- `/coaches` : listing + filtres
- `/coaches/[id]` : profil public + dispos + reviews
- `/sign-in`, `/sign-up`
- `/booking/[coachId]` : flow 4 étapes (créneau → récap → paiement → confirmation)
- `/dashboard` : coach (réservations / dispos / profil / historique)
- `/client` : joueur (mes sessions à venir / historique + reviews)
- `/chat/[bookingId]` : conversation temps réel
- `/admin` : console admin (stats, gestion users, suppression coachs)

## Schéma DB (Prisma)

`User` ⇆ `CoachProfile` (1-1, lorsque `role = COACH`)
`CoachProfile` 1-N `Availability`, `Booking`, `Review`
`Booking` 1-1 `Availability`, 1-1 `Review`, 1-N `Message`

Voir [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## Pour la suite (TODO produit)

- Brancher Stripe (`loadStripe()` + webhook) à la place du mock
- Notifications email (Resend) sur création/confirmation/annulation
- OAuth Discord / Google sur Supabase Auth
- Tests E2E Playwright + tests unitaires Vitest
- File d’attente de paiements et payouts coachs (Stripe Connect)

## Licence

Projet de démo, non affilié à Riot Games. Riot Games, Valorant et tous les rangs
mentionnés sont des marques déposées de Riot Games, Inc.
