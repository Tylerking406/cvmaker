# CvMaker — Development Guide

## Overview

CvMaker is a full-stack CV builder with two parts:

| Layer | Tech | Port |
|-------|------|------|
| **Frontend** | Next.js 15, Tailwind, shadcn/ui | 3000 |
| **Backend** | ASP.NET Core 8, PostgreSQL | 5133 |

---

## Quick Start — Mock Mode (no backend needed)

The frontend ships with a built-in mock API powered by Next.js route handlers. It serves realistic pre-seeded data so you can run and test the full UI without setting up .NET or PostgreSQL.

### Requirements
- Node.js 18+
- npm

### Steps

```bash
# 1. Clone and switch to the dev branch
git clone https://github.com/Tylerking406/cvmaker.git
cd cvmaker
git checkout claude/mock-api-local-dev

# 2. Install and run the frontend
cd cvmaker-ui
npm install
npm run dev
```

Open **http://localhost:3000** — the dashboard loads immediately with Arinao’s pre-seeded CV.

### What’s pre-loaded

The mock store seeds a full CV for **Arinao Ndou** (`dev@cvmaker.local`):

| Section | Entries |
|---------|---------|
| Personal Info | Name, job title, email, phone, location, LinkedIn, GitHub, summary |
| Work Experience | DigiOutsource (current), Kion Consulting, Tata-iMali — each with bullets |
| Education | BSc Computer Science & Engineering, UCT (2021–2024) |
| Skills | 6 categories: Backend, Frontend, Infrastructure, Messaging & Observability, Auth, Languages |
| Projects | AI Contract Summarisation API, Travel & Tour Booking Platform, Innovexia Portfolio Website |

Data survives hot reloads and resets on full dev server restart.

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

#### 4. Disable mock API

The mock routes (`cvmaker-ui/app/api/`) take priority over the proxy to localhost:5133. To use the real backend:

```bash
rm -rf cvmaker-ui/app/api
```

Then `npm run dev` in `cvmaker-ui/` — all `/api/*` calls will proxy to the .NET backend.

---

## Project Structure

```
cvmaker/
├── CvMaker.Api/              # ASP.NET Core 8 backend
│   ├── Controllers/          # REST API controllers
│   ├── Models/               # EF Core entity models
│   ├── DTOs/                 # Request / response shapes
│   └── Data/                 # AppDbContext
├── cvmaker-ui/               # Next.js 15 frontend
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── dashboard/        # CV list
│   │   ├── cv/[id]/          # CV editor (all sections)
│   │   │   └── preview/      # CV preview + print to PDF
│   │   └── api/              # Mock API route handlers (dev)
│   ├── components/ui/        # shadcn/ui component library
│   └── lib/
│       ├── api.ts            # Typed API client
│       └── mock-store.ts     # In-memory store + seed data
├── schema.sql                # Production schema (with RLS)
├── schema.local.sql          # Local dev schema (no RLS)
└── setup-local-dev.sh        # One-shot dev setup (Ubuntu)
```

---

## API Reference

All endpoints at `/api`. In mock mode they are served by Next.js route handlers; in real mode they proxy to the .NET backend on port 5133.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/cvs?userId=` | List CVs for a user |
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
| GET | `/api/health` | Health check |

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

## Switching between mock and real backend

| Mode | What to do |
|------|------------|
| **Mock** (default) | Just run `npm run dev` — no other setup needed |
| **Real backend** | `rm -rf cvmaker-ui/app/api` then start `dotnet run` in `CvMaker.Api/` |
