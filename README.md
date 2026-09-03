<p align="center">
  <img src="docs/images/jrmslogo.png" alt="Jewels logo" width="120" />
</p>

<h1 align="center">Jewels</h1>

<p align="center">
  <strong>Jewelry Rental Management System</strong><br />
  Manage ornaments, rentals, customers, and collections — all in one place.
</p>

<p align="center">
  Mobile-first web app for gold and silver ornament rental shops in India.<br />
  Built for speed at the counter: book, pickup, WhatsApp bill, return — in seconds.
</p>

---

## Product overview

<p align="center">
  <img src="docs/images/product-overview.jpeg" alt="Jewels RMS — dashboard, inventory, rentals, customers, accounts, and settings" width="100%" />
</p>

<p align="center"><em>Dashboard · Inventory · Rentals · Customers · Accounts · Settings</em></p>

| Screen | What it does |
|--------|----------------|
| **Dashboard** | Live stats (out on rent, bookings, pickups, returns due, income) with drill-down to filtered lists |
| **Inventory** | Photo catalog, item codes, search, future-booking badges, PDF export |
| **Rentals** | Bookings, pickups, returns, overdue tracking — filter by status |
| **Customers** | Searchable customer database with rental history |
| **Accounts** | Rental income and deposit ledger — daily, weekly, monthly |
| **Settings** | Outlets, categories, staff (admin) |

---

## Table of contents

- [Product overview](#product-overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Rental lifecycle](#rental-lifecycle)
- [API overview](#api-overview)
- [Production deployment](#production-deployment)
- [Scripts](#scripts)
- [Security notes](#security-notes)

---

## Features

### Inventory

- Ornament catalog per outlet with auto-generated item codes (`NEC0001`, `RNG0042`, …)
- Up to 5 photos per item (JPEG, PNG, WebP)
- Search by name, code, or category
- **Future bookings** badge per item (upcoming pre-bookings count)
- Date-range availability when creating rentals
- PDF export (full inventory or available-for-date-range)
- Soft delete (admin only)

### Pre-booking & rentals

- **5-step booking wizard:** dates → ornaments → customer → pricing → confirm
- Date-overlap conflict detection across `BOOKED`, `ACTIVE`, `OVERDUE`, and `EXTENDED` rentals
- **Payment plans at booking:**
  - 50% rent now, balance + deposit on pickup
  - Full rent now, deposit on pickup
  - Full rent + deposit now
- Flexible “collect now” amounts at confirmation (tracks balance automatically)
- **Pickup** — convert `BOOKED` → `ACTIVE`, collect remaining payments
- **Return** — mark `RETURNED`, record deposit refund
- **Extend** — push due date with optional extra rent charge
- **Reschedule** — change pickup/return dates on a booking
- **Swap item** — replace an ornament on an active rental
- **Cancel** — cancel pre-pickup bookings with optional rent/deposit refunds
- Dedicated pickup queue page for today’s scheduled handovers

### Customers

- Name, phone, address, optional ID proof
- Full rental history per customer
- Quick-create customer during booking

### Dashboard & operations

- Live stats with drill-down links: out on rent, total bookings, pickups today, due today, today’s income
- Pickups today list
- Overdue rentals with one-tap WhatsApp reminders
- Due for return carousel (today + tomorrow)
- Notifications page (pickups and returns due tomorrow)

### Accounts

- Rental income ledger (`RENTAL`, `RENTAL_ADVANCE`, `RENTAL_BALANCE`, refunds)
- Deposit collected / refunded / withheld tracking
- Filter by date range and payment method
- PDF export for accounts

### Multi-outlet & roles

| Role | Access |
|------|--------|
| **Staff** | Rentals, inventory (view), customers, accounts, pickups/returns |
| **Admin** | Everything staff can do, plus settings, staff management, ornament delete, outlet config |

Each user belongs to **one outlet**. Data is fully isolated between branches — no cross-branch view.

### WhatsApp integration

Pre-filled `wa.me` links for booking confirmations, rental bills, and overdue reminders. No WhatsApp Business API required.

### PWA

Installable on phones (Add to Home Screen). Optimised for portrait use at the shop counter.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **State** | Zustand (auth, wizard), TanStack Query (server state) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | JWT (Bearer token), bcrypt password hashing |
| **Files** | Multer (local disk storage) |
| **PDF** | jsPDF + jsPDF-AutoTable (client-side export) |
| **Monorepo** | pnpm workspaces |
| **Production** | PM2, Caddy (HTTPS reverse proxy) |

---

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser / PWA]
    Web[Next.js :3000]
  end

  subgraph server [Single server]
  Caddy[Caddy HTTPS]
  API[Express API :3001]
  PG[(PostgreSQL)]
  Disk[Uploads directory]
  end

  Web -->|"/api/v1/*"| Caddy
  Web -->|"/uploads/*"| Caddy
  Caddy --> API
  API --> PG
  API --> Disk
```

**Development:** Next.js dev server proxies `/api/*` to `http://localhost:3001`.  
**Production:** Caddy terminates TLS and routes `/api/*` and `/uploads/*` to Express; all other paths go to Next.js.

---

## Project structure

```
RentalManagementSystem/
├── apps/
│   ├── api/                 # Express REST API
│   │   ├── prisma/          # Schema, migrations, seed
│   │   └── src/
│   │       ├── routes/      # auth, ornaments, rentals, customers, payments, dashboard, settings
│   │       ├── middleware/  # auth, upload, error handling
│   │       └── utils/       # availability, payments, rental calc, date helpers
│   └── web/                 # Next.js frontend (PWA)
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # UI, rental wizard, shared
│           ├── lib/         # API client, formatters, PDF
│           └── stores/      # Zustand stores
├── packages/
│   └── types/               # Shared TypeScript types (@rental/types)
├── ecosystem.config.js      # PM2 process definitions
├── Caddyfile                # Production reverse proxy config
├── deploy.sh                # One-command production redeploy
└── pnpm-workspace.yaml
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+
- **PostgreSQL** 14+

### 1. Clone and install

```bash
git clone https://github.com/Sinu00/RentalManagementSystem.git
cd RentalManagementSystem
pnpm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` — at minimum set `DATABASE_URL` and `JWT_SECRET`:

```bash
# Generate a JWT secret
openssl rand -hex 32
```

### 3. Set up the database

```bash
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma db seed
```

### 4. Run locally

```bash
pnpm dev
```

This starts both services concurrently:

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| Health check | http://localhost:3001/api/v1/health |

### 5. Sign in

After seeding, use these **development-only** credentials:

| Outlet | Email | Password | Role |
|--------|-------|----------|------|
| Branch 1 | `admin@branch1.com` | `admin123` | Admin |
| Branch 1 | `staff@branch1.com` | `staff123` | Staff |
| Branch 2 | `admin@branch2.com` | `admin123` | Admin |

> **Change all default passwords before any production use.**

### Local troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Login fails / network error | API not running — use `pnpm dev` (both api + web), not web alone |
| `JWT_SECRET environment variable is required` | Missing `apps/api/.env` |
| Invalid credentials | Local DB not seeded, or password differs from production (separate databases) |
| Upload fails locally | Ensure `apps/api/uploads` is writable; API must be running |

---

## Environment variables

### API (`apps/api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/rental_db` |
| `JWT_SECRET` | Secret for signing auth tokens (required) | `openssl rand -hex 32` |
| `PORT` | API listen port | `3001` |
| `UPLOAD_DIR` | Directory for ornament photos | `./uploads` (local) or `/home/deploy/app/uploads` (prod) |
| `BASE_URL` | Public URL for image links | `http://localhost:3001` (local) or `https://your-domain.com` (prod) |
| `CORS_ORIGIN` | Allowed browser origin(s), comma-separated | `http://localhost:3000` |
| `TZ` | Timezone for date boundaries | `Asia/Kolkata` (set in production via PM2) |

### Web (`apps/web/.env.local` — optional locally)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base path | `/api/v1` (uses Next.js rewrite in dev) |

In production, set `NEXT_PUBLIC_API_URL=/api/v1` so requests stay same-origin through Caddy.

---

## Rental lifecycle

```mermaid
stateDiagram-v2
  [*] --> BOOKED: Create booking
  BOOKED --> ACTIVE: Complete pickup
  BOOKED --> CANCELLED: Cancel
  ACTIVE --> OVERDUE: Past due date
  ACTIVE --> EXTENDED: Extend
  OVERDUE --> EXTENDED: Extend
  EXTENDED --> OVERDUE: Past new due date
  ACTIVE --> RETURNED: Return
  OVERDUE --> RETURNED: Return
  EXTENDED --> RETURNED: Return
  CANCELLED --> [*]
  RETURNED --> [*]
```

| Status | Meaning |
|--------|---------|
| `BOOKED` | Pre-booking — dates reserved, ornaments not yet handed over |
| `ACTIVE` | Out with customer, within due date |
| `OVERDUE` | Out with customer, past due date |
| `EXTENDED` | Due date moved forward |
| `RETURNED` | Closed — items back, deposit handled |
| `CANCELLED` | Booking cancelled before pickup |

Ornaments are **blocked** for overlapping dates while a rental is `BOOKED`, `ACTIVE`, `OVERDUE`, or `EXTENDED`.

---

## API overview

Base path: `/api/v1`  
Authentication: `Authorization: Bearer <token>` on all routes except `POST /auth/login`.

| Route prefix | Purpose |
|--------------|---------|
| `/auth` | Login, current user |
| `/ornaments` | CRUD, images, categories, export |
| `/customers` | CRUD, rental history |
| `/rentals` | CRUD, pickup, cancel, return, extend, reschedule, swap-item |
| `/payments` | Ledger, export |
| `/dashboard` | Stats, overdue list, pickups today |
| `/settings` | Outlet, staff, categories (admin) |

**Useful rental list filters:**

| Query param | Description |
|-------------|-------------|
| `status` | Filter by rental status |
| `outOnly=true` | `ACTIVE` + `OVERDUE` + `EXTENDED` |
| `startDate` | Pickup date (YYYY-MM-DD) |
| `dueDate` | Return date (YYYY-MM-DD) |
| `search` | Rental number or customer name |

---

## Production deployment

Runs on a **single VPS** — AWS Lightsail in production — with:

- **PM2** — runs API (`apps/api/dist`) and web (`next start`) as `rms-api` and `rms-web`
- **Caddy** — automatic HTTPS, routes `/api/*` and `/uploads/*` to the API
- **PostgreSQL** — on the same server

### First-time setup (summary)

1. Point DNS A record to the server
2. Install Node 20, pnpm, PostgreSQL, Caddy, PM2
3. Clone repo, copy `apps/api/.env.production.example` → `apps/api/.env`, fill secrets
4. Copy `apps/web/.env.production.example` → `apps/web/.env.local`
5. Run migrations, build, seed (first time only), start PM2
6. Install `Caddyfile` at `/etc/caddy/Caddyfile` and reload Caddy
7. Create writable upload directory: `mkdir -p /home/deploy/app/uploads`

Critical production values in `apps/api/.env`:

```env
BASE_URL=https://your-domain.com
UPLOAD_DIR=/home/deploy/app/uploads
CORS_ORIGIN=https://your-domain.com
```

### Redeploy

```bash
./deploy.sh
```

Pulls latest code, installs dependencies, runs migrations, builds, and reloads PM2 with zero downtime.

### Backups

- **Database:** nightly `pg_dump` (not in git — configure on server)
- **Uploads:** `UPLOAD_DIR` is outside git; back up regularly

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web in development |
| `pnpm build` | Build types → API → web |
| `pnpm lint` | Lint all packages |
| `pnpm --filter api dev` | API only (tsx watch) |
| `pnpm --filter web dev` | Web only (Next.js on :3000) |
| `pnpm --filter api exec prisma studio` | Open Prisma Studio |
| `pnpm --filter api exec prisma db seed` | Seed demo outlets and users |

---

## Security notes

- JWT tokens expire after 7 days
- Login rate-limited (20 attempts per 15 minutes per IP)
- Passwords hashed with bcrypt (cost factor 12)
- Outlet-scoped data access on every API route
- Admin-only routes for staff management, ornament deletion, and settings
- Helmet security headers on the API
- **Never commit** `.env` files or upload directories

---

## Design principles

- **Mobile-first** — counter staff use phones; desktop is secondary
- **Speed at the counter** — primary actions in two taps or fewer
- **Trust in every number** — rupee amounts in Indian formatting (₹1,20,000), dates always visible
- **Calm density** — enough to act, nothing more

See [`PRODUCT.md`](PRODUCT.md) for full product and brand guidelines.

---

## License

Private / proprietary. All rights reserved unless otherwise specified by the repository owner.
