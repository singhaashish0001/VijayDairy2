# Vijay Dairy

Dairy shop operations app: products, invoices, inventory, dashboard, business settings, and public invoice sharing.

- **Frontend**: React + Vite + **TypeScript**, **MobX** for state, Tailwind CSS.
- **Backend**: **Node.js + Express + TypeScript** REST API (`Backend/`), talking to the database with `pg`.
- **Database**: **Supabase** (hosted PostgreSQL). The API is the only client; login uses its own JWT auth.
- **Documents**: `Documents/` — User Manual, Architecture reference and Setup guide as `.docx` (written for the earlier .NET version; the API contract is unchanged).

## Prerequisites

- Node.js 20+
- A Supabase project

## Database setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of `Backend/supabase/schema.sql` and run it.
3. Open **Project Settings → Database → Connection string**, copy the **pooler** URI and put it in `Backend/.env` as `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your database password).

## Backend

```bash
cd Backend
cp .env.example .env     # then fill in DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD
npm install
npm run dev              # http://localhost:5227
```

Other scripts: `npm test` (vitest), `npm run typecheck`, `npm run build` + `npm start` (production).

Configuration (`Backend/.env`, see `.env.example`):

- `DATABASE_URL` — Supabase Postgres connection string (`DATABASE_SSL=false` only for a non-SSL local Postgres)
- `JWT_SECRET` / `JWT_ISSUER` / `JWT_AUDIENCE` / `JWT_EXPIRY_HOURS`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` — seeded as the initial admin user on startup if no user has that email
- `CORS_ORIGINS` — comma-separated allowed frontend origins
- `PORT` — defaults to 5227 (matches the frontend proxy)

**Use a long random `JWT_SECRET` and a strong `ADMIN_PASSWORD`; never commit `.env`.**

Project layout:

```
Backend/
  supabase/schema.sql        Tables, indexes, seed rows, RLS
  src/
    index.ts / app.ts        Startup + admin seeding / Express app wiring
    config.ts, db.ts         Environment config / pg pool (NUMERIC parsed to numbers)
    envelope.ts, errors.ts   { error, statusCode, messageId, messageText, data } envelope and error types
    middleware/              JWT auth, camelCase key normalisation, UUID param check, error handler
    routes/                  auth, products, invoices, settings, dashboard, public
    services/                lineCalculator, invoiceService, csvParser, importProducts, importStock, dashboardService
    repositories/            SQL access for users, products, invoices, settings
  tests/                     vitest suites (line maths, CSV imports, API contract)
```

Every response uses the envelope `{ error, statusCode, messageId, messageText, data }`; thrown errors are mapped to the same shape with the real HTTP status by `middleware/common.ts`. JSON is camelCase; request bodies may use PascalCase keys (the frontend does) — the first letter of every key is normalised.

## Frontend

```bash
cd Frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` to `http://localhost:5227` in dev (see `vite.config.ts`). Environment variables live in `.env.development` / `.env.production`; `VITE_API_URL` overrides the proxy when set to an absolute URL (must include the `/api` suffix), and `VITE_PUBLIC_URL` sets Vite's `base` path.

Project layout:

```
Frontend/src/
  core/
    interceptor/interceptor.ts   Axios instance: Bearer token injection, 401 → clear session + redirect
    service/base-service.ts      Typed get/post/put/delete wrappers over the interceptor's Axios instance
    stores/                      MobX class stores (auth, product, invoice, settings, dashboard, public-invoice)
  contexts/                      store-provider, auth-provider (re-validates the token via /auth/me), theme-provider
  constants/                     url-constants.ts, error-constants.ts
  models/                        forms/, response/, state/ — TypeScript interfaces
  helpers/                       config-helper, secure-storage, format, pdf, csv-template, line-item-calc
  shared-components/             layout.tsx, protected-route.tsx
  modules/                       auth, dashboard, product, invoice, settings, public-invoice
```

## Deploying everything on Netlify (no separate API host)

The repo is ready for a single Netlify site: the React build is served statically and the Express API runs as a Netlify Function at `/api` (same domain, no CORS). `netlify.toml` holds the build settings and redirects; `netlify/functions/api.ts` loads `Backend/src/serverless.ts`.

1. In Netlify: **Add new site → Import an existing project**, pick this repo and the `main` branch. **Leave all Build settings fields empty** (they come from `netlify.toml`).
2. Add these environment variables (mark secrets as secret):
   - `DATABASE_URL` — Supabase **Transaction pooler** URI (port 6543), password URL-encoded
   - `PG_POOL_MAX=1`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `VITE_API_URL=/api`, `VITE_SECURE_STORAGE_ACTIVE=true` (public build-time values — never put secrets in `VITE_*`)
3. Deploy, then open `https://<site>.netlify.app/api/auth/me` (expect an empty 401) and sign in.

The admin user is created lazily on the first request after a deploy. Locally you can test the same setup with `npx netlify-cli dev --dir Frontend/dist` after `npm --prefix Frontend run build`.

## Notes on API design

- All endpoints except `POST /api/auth/login` and `GET /api/public/invoices/:id` require `Authorization: Bearer <JWT>`.
- Invoice items are stored as JSONB on the `invoices` row; quantity, amount and totals are recomputed server-side from the rate (`services/lineCalculator.ts`, mirrored by `Frontend/src/helpers/line-item-calc.ts` — keep both in sync).
- Invoice numbers follow `VD-YYYYMM-XXXX`, from an atomic counter in the same transaction as the invoice insert and stock decrement.
- `GET /api/public/invoices/:id` is unauthenticated and does not expose `inventoryEnabled`.

## Known gaps (kept as-is from the original app)

- The API trusts client-supplied item price/name/unit rather than re-validating against the current product record.
- No stock-availability check on invoice creation — stock can go negative; deleting an invoice does not restore stock.
- Products/invoices list endpoints are capped at 1000 rows with no pagination, and the dashboard aggregates only the latest 1000 invoices.
- Logout does not revoke the JWT server-side (client-side token discard only).
