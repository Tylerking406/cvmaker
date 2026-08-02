# CvMaker — Development Guide

## Overview

CvMaker is a full-stack CV builder with two parts:

| Layer | Tech | Port |
|-------|------|------|
| **Frontend** | Next.js 15, Tailwind, shadcn/ui | 3000 |
| **Backend** | ASP.NET Core 8, PostgreSQL | 5133 |

---

## Quick Start — Docker Compose

The mock API has been removed. The .NET API owns authentication and all data, so the
backend must be running.

```bash
git clone https://github.com/Tylerking406/cvmaker.git
cd cvmaker
docker compose up --build
```

Open **http://localhost:3000**. You will be redirected to `/login`.

### Seeded dev account

| Email | Password |
|-------|----------|
| `arinao.dev@gmail.com` | `Test1234` |

Seeded on API startup in Development by `CvMaker.Api/Data/DbInitializer.cs`, which is
idempotent — it never overwrites an existing password.

### ⚠️ Upgrading an existing database

Postgres only runs `/docker-entrypoint-initdb.d/*` on the **first** init of an empty
volume, so an existing `postgres_data` predates the `password_hash` column. `DbInitializer`
issues `ALTER TABLE … ADD COLUMN IF NOT EXISTS` on every Development start to cover this,
so no action is normally needed. For a clean slate:

```bash
docker compose down -v && docker compose up --build   # destroys local data
```

---

## Authentication

The API mints HS256 JWTs in **Supabase's claim shape** (`sub`, `email`, `aud=authenticated`,
`role=authenticated`), so pointing this app at a real Supabase project later is a config
change rather than a rewrite — see `diagrams.md`.

| | |
|---|---|
| Signing key | `Supabase__JwtSecret` env var. **The API refuses to start** if it is missing or under 32 bytes. |
| Issuer | `Supabase__Issuer`, default `http://localhost:5133/auth/v1` |
| Expiry | `Supabase__ExpiryMinutes`, default 60 |

**Two transports.** Login and register return the token in the JSON body *and* set an
httpOnly `cvm_token` cookie. The browser uses the cookie (it survives refresh, and Next.js
middleware reads it to guard `/dashboard` and `/cv`); everything else uses
`Authorization: Bearer`. The API accepts either.

**Authorization is default-deny.** `Program.cs` sets a `FallbackPolicy` requiring an
authenticated user, so every endpoint is protected unless it opts out with
`[AllowAnonymous]` — currently only `/health` and the register/login/logout endpoints.

**Ownership.** `[Authorize]` alone does not stop a valid token passing someone else's
`cvId`, so `Auth/CvOwnershipFilter.cs` is applied to all seven child-resource controllers
and `CvsController` folds the owner into each query. Cross-account access returns **404,
not 403**, so it never confirms that a CV id exists.

### Auth endpoints

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/api/auth/register` | anonymous | 400 if password < 8 chars, 409 if email taken |
| POST | `/api/auth/login` | anonymous | 401 with the same message for unknown email or wrong password |
| GET | `/api/auth/me` | required | Rehydration after refresh; returns `{accessToken, user}` |
| POST | `/api/auth/logout` | anonymous | Clears the cookie |
| POST | `/api/auth/forgot-password` | anonymous | **Always 200**, registered or not — otherwise it enumerates accounts |
| POST | `/api/auth/reset-password` | anonymous | Single-use token, 1-hour expiry |

All `/api/auth/*` routes are rate limited to **10 requests/minute per IP**, returning 429
with `Retry-After`. This relies on `UseForwardedHeaders`; behind a proxy that doesn't send
`X-Forwarded-For`, every caller shares one bucket.

### Startup guards

The API refuses to start rather than run in a silently-broken state:

| Condition | Why |
|---|---|
| `Supabase__JwtSecret` missing or < 32 bytes | An empty HMAC key accepts forged tokens |
| `Supabase__JwtSecret` is the repo default and env ≠ Development | That value is committed here, so it is public — anyone could forge tokens |
| `Email__Smtp__Host` unset and env ≠ Development | Reset mail would be silently dropped, locking users out |

Copy `.env.example` to `.env` and fill these in before deploying.

### Schema

EF Core migrations in `CvMaker.Api/Data/Migrations/` are the single source of truth, applied
automatically on startup in **every** environment. There are no SQL schema files to run —
`docs/future/supabase-target.sql` is a reference target, not something the app uses.

```bash
dotnet ef migrations add <Name> -o Data/Migrations   # after changing a model
```

The dev fixture account is seeded only when **both** `ASPNETCORE_ENVIRONMENT=Development`
and `Seed__Enabled=true`. Note `CvMaker.Api/Dockerfile` sets Production while
`docker-compose.yml` overrides it to Development — that is why one signal alone isn't enough.

`GET`/`POST /api/users` have been **removed** — the former dumped every user row.

---

## Full-Stack Mode (with real backend)

### Automated setup (Ubuntu/Debian)

From the repo root:

```bash
chmod +x setup-local-dev.sh
./setup-local-dev.sh
```

This installs .NET 8, Node.js, PostgreSQL, VS Code, applies the DB schema, restores packages, and installs npm deps.

### Manual setup

#### 1. Database

```bash
sudo -u postgres psql -c "CREATE USER cvmaker WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE cvmakerdb OWNER cvmaker;"
psql -U cvmaker -d cvmakerdb -h localhost -f schema.local.sql
```

#### 2. Backend config

Create `CvMaker.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cvmakerdb;Username=cvmaker;Password=yourpassword"
  }
}
```

#### 3. Run the API

```bash
cd CvMaker.Api
dotnet run
```

- API: **http://localhost:5133**
- Swagger UI: **http://localhost:5133/swagger**
- Health check: **http://localhost:5133/health**

The API will not start unless `Supabase__JwtSecret` is set to at least 32 bytes:

```bash
export Supabase__JwtSecret="local-dev-only-secret-change-me-32chars-min"
```

#### 4. Run the frontend

```bash
cd cvmaker-ui && npm run dev
```

All `/api/*` calls proxy to the .NET backend via the `fallback` rewrite in
`next.config.ts`. Set `BACKEND_URL` in `.env.local` if the API is not on port 5133.

---

## Project Structure

```
cvmaker/
├── CvMaker.Api/              # ASP.NET Core 8 backend
│   ├── Auth/                 # JWT minting, cookie, claims, ownership filter
│   ├── Controllers/          # REST API controllers (incl. AuthController)
│   ├── Models/               # EF Core entity models
│   ├── DTOs/                 # Request / response shapes
│   └── Data/                 # AppDbContext + DbInitializer (dev seed)
├── cvmaker-ui/               # Next.js 15 frontend
│   ├── middleware.ts         # Cookie-based route guard for /dashboard and /cv
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Sign in / create account
│   │   ├── dashboard/        # CV list
│   │   └── cv/[id]/          # CV editor (all sections)
│   │       └── preview/      # CV preview + print to PDF
│   ├── components/ui/        # shadcn/ui component library
│   └── lib/
│       ├── api.ts            # Typed API client (token + 401 handling)
│       └── auth-context.tsx  # Session state, sign in/up/out
├── schema.sql                # Production schema (with RLS)
├── schema.local.sql          # Local dev schema (no RLS)
└── setup-local-dev.sh        # One-shot dev setup (Ubuntu)
```

---

## API Reference

All endpoints at `/api`, proxied to the .NET backend on port 5133.

**Every endpoint below requires authentication** and is scoped to the caller's token. A
CV belonging to another account returns 404, never its contents. See the Authentication
section above for the auth endpoints.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cvs` | List the caller's CVs (no `userId` — it comes from the token) |
| POST | `/api/cvs` | Create CV |
| GET | `/api/cvs/:id` | Get CV |
| PUT | `/api/cvs/:id` | Update CV title / template |
| DELETE | `/api/cvs/:id` | Delete CV (cascades) |
| GET | `/api/cvs/:id/personal-info` | Get personal info |
| PUT | `/api/cvs/:id/personal-info` | Upsert personal info |
| GET | `/api/cvs/:id/work-experience` | List entries |
| POST | `/api/cvs/:id/work-experience` | Add entry |
| PUT | `/api/cvs/:id/work-experience/:eid` | Update entry |
| DELETE | `/api/cvs/:id/work-experience/:eid` | Delete entry |
| GET | `/api/cvs/:id/education` | List entries |
| POST | `/api/cvs/:id/education` | Add entry |
| PUT | `/api/cvs/:id/education/:eid` | Update entry |
| DELETE | `/api/cvs/:id/education/:eid` | Delete entry |
| GET | `/api/cvs/:id/skills` | List categories |
| POST | `/api/cvs/:id/skills` | Add category |
| PUT | `/api/cvs/:id/skills/:eid` | Update category |
| DELETE | `/api/cvs/:id/skills/:eid` | Delete category |
| GET | `/api/cvs/:id/projects` | List projects |
| POST | `/api/cvs/:id/projects` | Add project |
| PUT | `/api/cvs/:id/projects/:eid` | Update project |
| DELETE | `/api/cvs/:id/projects/:eid` | Delete project |
| GET | `/api/cvs/:id/certifications` | List certifications |
| POST | `/api/cvs/:id/certifications` | Add certification |
| DELETE | `/api/cvs/:id/certifications/:eid` | Delete certification |
| GET | `/api/cvs/:id/achievements` | List achievements |
| POST | `/api/cvs/:id/achievements` | Add achievement |
| DELETE | `/api/cvs/:id/achievements/:eid` | Delete achievement |
| GET | `/health` | Health check — the one anonymous endpoint (the compose healthcheck polls it) |

---

## CV Preview & PDF Export

Navigate to `/cv/:id/preview` to see the rendered CV. Click **Print / Save PDF** to export via the browser print dialog (choose “Save as PDF”).

The preview matches the reference CV design:
- Centred teal name
- 2-column contact header (phone + GitHub left, email + LinkedIn right)
- Teal section headings with underline
- `Date | Role | Company` entry format
- Middle-dot (`·`) bullets
- Serif font

---

## Verifying auth end-to-end

```bash
docker compose down -v && docker compose up --build -d

curl -i localhost:5133/health                                     # 200, anonymous
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/cvs   # 401

A=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"arinao.dev@gmail.com","password":"Test1234"}' | jq -r .accessToken)

# Claim shape must be Supabase's: sub, email, aud/role = "authenticated" — and no "nameid"
echo "$A" | cut -d. -f2 | base64 -d 2>/dev/null | jq .

# A tampered signature must be rejected — this is what proves validation is really on
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/cvs -H "Authorization: Bearer ${A}x"   # 401
```

Then register a second user and confirm every one of these prints `404` — no CV of A's is
reachable with B's token:

```bash
for u in "" /personal-info /work-experience /education /skills /projects /certifications /achievements; do
  curl -s -o /dev/null -w "$u %{http_code}\n" "http://localhost:3000/api/cvs/$CV$u" -H "Authorization: Bearer $B"
done
```
