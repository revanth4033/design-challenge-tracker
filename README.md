# Design Challenge Tracker

A simple, polished internal tool for running **timed UI/UX design challenges**. Every candidate gets a **5-hour window**; the dashboard shows a **live countdown** for each one. Built to feel like a modern SaaS admin dashboard (Linear / Stripe / Vercel).

Data is stored in a **shared hosted Postgres database**, so the board is the **same on every device**. Mark someone "Selected" on one laptop and it appears on every other laptop within a few seconds.

---

## How it works

- One **Neon Postgres** database holds all candidates. Every browser reads and writes to it through `/api/candidates`.
- The dashboard **auto-refreshes every 5 seconds** (and on window focus), so changes made elsewhere show up automatically.
- Candidates are seeded once from the real sheet (`lib/seed-data.json`) the first time the database is used.
- Countdowns are computed from stored `startedAt` / `endsAt` timestamps, so they stay correct across refresh and devices.

---

## Setup

### 1. Provision the database (one time, on Vercel)

1. Open your project on Vercel → **Storage** tab → **Create Database** → **Neon (Postgres)** → follow the prompts.
2. Vercel adds the `DATABASE_URL` environment variable to the project automatically.
3. Redeploy (any push triggers this). The table is created and seeded on first load — no migrations to run.

That's it — the app is live and shared across all devices.

### 2. Run locally (optional)

```bash
npm install
cp .env.example .env        # paste your Neon connection string into .env
npm run dev                 # http://localhost:3000
```

Local dev talks to the same Neon database, so you can develop against real data.

---

## Features

**Dashboard** (`/`)
- KPI cards: Total, Running, Time Up, Submitted, Selected, Rejected, Absent
- Table: Candidate, Challenge, Start, End, **live Remaining countdown**, Status, Actions
- Search by name / email / phone · filter by status · sort by remaining / start / end / name
- Color-coded badges; rows flag amber under 30 min and red when time is up

**Start Challenge** — stores the current time, sets `end = start + 5h`, flips to Running.

**Candidate detail** (`/candidates/[id]`)
- Full info (with working portfolio / resume links from the sheet), large live countdown
- Status controls: Submitted, Interview Completed, On Hold, Selected, Rejected, Absent, Clear
- Interviewer feedback box (save / edit / delete)
- Alert banners for < 30 min and time-up

**Add candidate** (`/candidates/new`) · **Import Excel** (`/import`) — parsed in the browser, written to the shared database.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI, Nova preset) + **Lucide** icons
- **Zustand** — client store with optimistic updates + background polling; a 1-second clock drives the countdowns
- **Neon Postgres** via `@neondatabase/serverless`, accessed through Next.js route handlers (candidates stored as JSONB)
- **SheetJS (`xlsx`)** — client-side Excel import

No authentication — single-team internal tool by design.

---

## Project structure

```
app/
  page.tsx                  Dashboard
  candidates/new/page.tsx   Add candidate
  candidates/[id]/page.tsx  Candidate detail
  import/page.tsx           Excel import
  api/candidates/           GET list / POST upsert / DELETE — shared DB access
components/                 dashboard, detail, forms, sync provider, status badge, countdown
lib/
  db.ts                     Neon access: schema, seed, list/upsert/delete
  store.ts                  Zustand store (optimistic) + clock + UI state
  seed-data.json            the 40 real candidates from the sheet
  time.ts                   countdown / status / alert helpers
  import-excel.ts           header-based Excel parser (browser)
```
