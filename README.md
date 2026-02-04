# pragmas — Sentinel OS

AI Investment Intelligence Operating System (portfolio analytics, risk intelligence, research automation, and auditable journaling).

Constraints:
- Modular monolith
- Next.js App Router full-stack (single Node runtime)
- PostgreSQL + Prisma
- Custom JWT auth (no trade execution)
- Embedded scheduler (node-cron)

## Quickstart

1) Install deps

```bash
npm install
```

2) Start PostgreSQL locally (recommended)

This repo includes a minimal Postgres 15 container.

```bash
docker compose up -d db
```

3) Configure env vars

Copy `.env.local.example` to `.env.local` and set:
- `DATABASE_URL` (local)
- `JWT_SECRET`
- `AI_PROVIDER_KEY` (optional for now)
- `APP_URL` (used for Stripe redirects)
- Stripe billing (optional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`

4) Create DB tables

```bash
npx prisma migrate dev
```

5) Run dev server

```bash
npm run dev
```

6) Run the scheduler worker (separate process)

The cron scheduler runs in a dedicated Node process to keep Next.js builds clean and edge-safe.

```bash
npm run worker:scheduler
```

Or run both app + worker together:

```bash
npm run dev:all
```

Open http://localhost:3000

## Scripts

- `npm run build` / `npm start` (Hostinger-friendly)
- `npm test` (Vitest unit + route handler tests)
- `npm run prisma:generate`
- `npm run prisma:migrate`

## Production-mode smoke check (local)

Periodically validate the production build artifacts:

```bash
npm run build
npm start
```

## Repo Structure (mandated)

- `app/` route modules + `app/api/*` REST endpoints
- `src/` core services, tools, skills, auth, scheduler
- `prisma/schema.prisma` database schema

## Auth

- Routes: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Session: signed JWT stored in an HttpOnly cookie (`sentinel_session`)
- Protected UI paths enforced by `middleware.ts`

## Scheduler

Scheduler starts on server boot via `instrumentation.ts` and logs triggers for:
- Daily digest
- Risk monitoring
- Weekly review

## Deployment (Hostinger Node.js Web Apps)

The project is designed to deploy with:

```bash
npm install
npm run build
npm start
```

## Stripe Billing (tiers)

- Checkout endpoint: `POST /api/billing/checkout` with `{ tier: "PRO" | "ELITE" }`
- Portal endpoint: `POST /api/billing/portal`
- Webhook endpoint: `POST /api/billing/webhook` (updates `users.plan_tier` and Stripe IDs)

## Research Vault (RAG simplified)

- Ingest doc: `POST /api/research` with `{ title, content, source? }`
- Query chunks: `GET /api/research?q=...`
- Metering: `research.query` is counted per month in `usage_meters` (FREE defaults to 3/month)
