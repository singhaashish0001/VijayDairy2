# Vijay Dairy

Dairy shop operations app: products, invoices, inventory, dashboard, business settings, and public invoice sharing.

- **Frontend**: React + Vite + **TypeScript**, **MobX** for state, Tailwind CSS — folder structure (`core/stores`, `core/service`, `core/interceptor`, `contexts`, `modules/<feature>`) follows the monoZTrack frontend architecture.
- **Backend**: ASP.NET Core Web API (.NET 10), layered into 6 projects (Api / Application / Domain / Persistence / Postgres / Common) with **MediatR CQRS** (a Command or Query + Handler per action) and **raw ADO.NET via Npgsql** — no Entity Framework, no Dapper. Follows the monoZTrack backend architecture.
- **Database**: PostgreSQL
- **Documents**: `Documents/` — User Manual, Architecture reference (with diagram), and a Setup/Step-by-Step Guide, all as `.docx`.

## Prerequisites

- .NET 10 SDK
- Node.js 18+ (project was set up with Node 24 via nvm)
- PostgreSQL 14+

## Database setup

Create the database and load the schema:

```bash
psql -U postgres -c "CREATE DATABASE vijay_dairy;"
psql -U postgres -d vijay_dairy -f Backend/db/schema.sql
```

## Backend

```bash
cd Backend
dotnet run --project VijayDairy.Api
```

Runs on `http://localhost:5227` (the `http` profile in `VijayDairy.Api/Properties/launchSettings.json` — also what Visual Studio uses when you hit Run/F5). Override with `dotnet run --project VijayDairy.Api --urls "http://localhost:<port>"` if you need a different port, and update `Frontend/.env.development`'s `VITE_API_URL` / `vite.config.ts`'s proxy target to match.

Project layout:

```
Backend/
  VijayDairy.Api/            Controllers, Program.cs, Middlewares/ErrorHandling.cs, Helpers/ServiceManager.cs
  VijayDairy.Application/    Managements/<Feature>Management/{Commands,Queries}/<Action>/{Command,Handler,Validator}
  VijayDairy.Domain/         Entities, Models/*VM.cs (view models), Models/Common/ResponseModel.cs
  VijayDairy.Persistence/    Repository interfaces + IDbHelper
  VijayDairy.Postgres/       PostgresHelper (raw ADO.NET) + repository implementations
  VijayDairy.Common/         Enums (with [Description] + GetEnumDescription()), Exceptions
  db/schema.sql
```

Every MediatR handler returns a `ResponseModel<T>` (`error`, `statusCode`, `messageId`, `messageText`, `data`); thrown exceptions (`NotFoundException`, `DuplicateResourceException`, `ValidationException`, `InvalidEmailOrPasswordException`, `UnauthorizedException`) are caught by `ErrorHandling` middleware and mapped to the same envelope + HTTP status. JSON is serialized camelCase (Newtonsoft, ASP.NET Core's default `AddNewtonsoftJson()` contract resolver) — this is the one deliberate deviation from monoZTrack's PascalCase convention, kept because it's the normal REST/JS convention this frontend expects.

Configuration lives in `appsettings.json` (override locally via `appsettings.Development.json`, which is gitignored, or environment variables):

- `ConnectionStrings:Postgres` — Postgres connection string
- `Jwt:Secret` / `Jwt:Issuer` / `Jwt:Audience` / `Jwt:ExpiryHours`
- `Admin:Email` / `Admin:Password` / `Admin:Name` — seeded as the initial admin user on first run if no user exists
- `Cors:AllowedOrigins` — array of allowed frontend origins

On startup, if no admin user exists, one is created from `Admin:Email` / `Admin:Password`. **Change the default admin password and JWT secret before deploying anywhere non-local.**

## Frontend

```bash
cd Frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` to `http://localhost:5227` in dev (see `vite.config.ts`). Environment variables live in `.env.development` / `.env.production` (Vite's standard mode-based files — see the header comment in each for what every variable does); `VITE_API_URL` overrides the proxy when set to an absolute URL (must include the `/api` suffix), and `VITE_PUBLIC_URL` sets Vite's `base` path.

Project layout:

```
Frontend/src/
  core/
    interceptor/interceptor.ts   Axios instance: Bearer token injection, 401 → clear session + redirect
    service/base-service.ts      Typed get/post/put/delete wrappers over the interceptor's Axios instance
    stores/                      MobX class stores (auth, product, invoice, settings, dashboard, public-invoice)
      interfaces/                Store contracts (e.g. IProductStore)
    initial-state/               Reusable IObservableInitialState initial values (not currently needed per-store)
  contexts/
    store-provider.tsx           React context exposing the MobX root store via useStore()
    auth-provider.tsx            Re-validates a persisted token against /auth/me on mount
  constants/                     url-constants.ts, error-constants.ts
  models/                        forms/, response/, state/, ICommon.ts — TypeScript interfaces
  helpers/                       config-helper, secure-storage (XOR-obfuscated localStorage), format, pdf
  shared-components/             layout.tsx, protected-route.tsx
  modules/
    auth/login.tsx
    dashboard/dashboard.tsx
    product/product.tsx + components/{product-dialog,import-dialog}.tsx
    invoice/{create-invoice,invoices}.tsx
    settings/settings.tsx
    public-invoice/public-invoice.tsx
```

Each MobX store instance is a singleton (`export default new XStore()`), aggregated into a `RootStore` in `core/stores/index.ts`, and consumed in components via `observer(Component)` + `useStore()`.

## Notes on API design

- All authenticated endpoints require `Authorization: Bearer <JWT>`.
- Invoice items are stored as JSONB on the `invoices` row (server-computed totals from client-submitted line items — see "Known gaps" below).
- Invoice numbers follow `VD-YYYYMM-XXXX`, generated from an atomic Postgres counter inside the same transaction as invoice insert + stock decrement.
- `GET /api/public/invoices/{id}` is unauthenticated and does not expose `inventoryEnabled`.

## Known gaps (carried over from the original requirements doc)

- The API trusts client-supplied item price/name/unit rather than re-validating against the current product record server-side.
- No stock-availability check on invoice creation — stock can go negative.
- Products/invoices list endpoints are capped at 1000 rows with no pagination.
- Logout does not revoke the JWT server-side (client-side token discard only).

## Scope decisions vs. monoZTrack's full architecture

Deliberately not carried over, since they're specific to monoZTrack's domain (IoT device tracking) or add enterprise scope this app doesn't need:

- **AutoMapper** — handlers map between Entity and VM by hand instead.
- **Audit logging** — no `AuditLog` entity/repository/table.
- **NLog `ApplicationLogger` project** — uses ASP.NET Core's built-in `ILogger` instead.
- **Infrastructure project** (device decoders) — not applicable.
- **MSAL/SSO auth, i18n, AES-GCM secure-storage** — this app only needs email/password login and a lighter XOR-obfuscated localStorage wrapper.
