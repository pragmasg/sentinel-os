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

2) Configure env vars

Copy `.env.example` to `.env` and set:
- `DATABASE_URL`
- `JWT_SECRET`
- `AI_PROVIDER_KEY` (optional for now)
- `APP_URL` (used for Stripe redirects)
- Stripe billing (optional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`

3) Create DB tables

```bash
npm run prisma:migrate
```

4) Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run build` / `npm start` (Hostinger-friendly)
- `npm test` (Vitest unit + route handler tests)
- `npm run prisma:generate`
- `npm run prisma:migrate`

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
