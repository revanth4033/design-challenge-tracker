# Design Challenge Tracker

A polished internal tool that replaces a multi-sheet Excel workflow for running **timed UI/UX design challenges**. Every candidate gets a **5-hour window**; the dashboard shows a **live countdown** for each one that stays correct across page refreshes and browser restarts because every timer is computed from stored timestamps — never from a browser-only counter.

Built to feel like a modern SaaS admin dashboard (Linear / Stripe / Vercel), with clean spacing, high information density, and no flashy animation.

---

## 1. Where this came from — Excel analysis

The original system was `Final Selected Candidates.xlsx`:

- **5 sheets** — `Batch 1`, `Batch 2`, `Batch 3`, `Batch 4` (candidate rows) and `Total count` (a summary).
- **40 candidates** total across the four batches (11 / 9 / 9 / 11).
- Columns per batch sheet: **Name, Email ID, Mobile Number, Current Designation, Total Experience, Relevant Experience, Location, Notice Period, Portfolio, Resume, Present/Absent, Task Name (POS/Raw management), Timings, Task status (Select/reject)**.

Problems this app fixes:

| Excel pain point | Fix in the app |
| --- | --- |
| No way to track multiple running challenges at once | Live dashboard with a per-candidate countdown |
| `Timings` was only a start time — end time / remaining was never computed | Start time is stored; **end = start + 5h**; remaining is derived every second |
| Challenge names were inconsistent (`Hotel POS`, `Hotel Raw mgmt`, `Hotel Raw Management`) | A normalized **Challenge** catalog; importer maps variants to canonical names |
| Batch 3 had a **different column order** | Importer maps columns **by header text**, not by position |
| Status scattered across `Present/Absent` + `Task status` with no "running/completed" concept | A single status lifecycle with a derived `COMPLETED` state |
| Mobile numbers stored as floats (`7.79e9`) | Imported and formatted back to plain digits |

The importer understands this exact workbook, so you can drop the original file straight into **Import Excel**.

---

## 2. Data model (Prisma + SQLite)

```
Challenge ──< Candidate ──< StatusHistory
```

- **Challenge** — catalog of challenge types (`Hotel POS`, `Hotel Raw Management`, …). `durationMinutes` defaults to **300 (5h)**. Add a row to support a new challenge type — fully extensible.
- **Candidate** — every field from the sheet plus `batch`, `challengeId`, `startedAt`, `endsAt`, and `status`. Countdown is always `endsAt − now`.
- **StatusHistory** — an audit trail row for every status change.

**Status** is stored as one of `NOT_STARTED · RUNNING · SUBMITTED · SELECTED · REJECTED · ABSENT`.
`COMPLETED` is **never stored** — it is derived when a candidate is `RUNNING` and `now ≥ endsAt`. This keeps timers purely timestamp-based.

### Visual priority system

| Effective status | Badge |
| --- | --- |
| Running | Green |
| Running, < 1 hour left | Orange |
| Time up (expired) | Red |
| Submitted | Blue |
| Selected | Solid green (success) |
| Rejected | Red |
| Absent | Gray |

Rows highlight amber under 30 minutes and red once expired; the candidate page shows matching alert banners.

---

## 3. Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives, Nova preset) + **Lucide** icons
- **Zustand** — a single 1-second global clock that drives countdown re-renders, plus dashboard UI state
- **Prisma 7** ORM with a **SQLite** database via the **libSQL** driver adapter
- **SheetJS (`xlsx`)** for Excel import

No authentication — single-user internal tool by design.

---

## 4. Setup

> Requires **Node.js 20.9+**.

```bash
# 1. install dependencies (also runs `prisma generate`)
npm install

# 2. create your env file
cp .env.example .env

# 3. create the database, generate the client, and load sample data
npm run db:migrate      # applies migrations and creates dev.db
npm run db:seed         # loads the real 40 candidates from the sheet + 2 challenge types

# 4. start the app
npm run dev
```

Open **http://localhost:3000**.

> **One-liner for a fresh machine** (after `npm install` and `cp .env.example .env`):
> ```bash
> npm run setup && npm run dev
> ```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | Apply Prisma migrations (creates `dev.db`) |
| `npm run db:seed` | Load the real dataset from the sheet (40 candidates) |
| `npm run db:reset` | Drop, re-migrate, and re-seed |
| `npm run db:studio` | Open Prisma Studio to inspect data |

The seed loads the **actual 40 candidates** from `Final Selected Candidates.xlsx` (data in `prisma/seed-data.json`). The 16 marked **Present** with a challenge and a start time are seeded as **Running**, anchored to today at their recorded start time (e.g. `14:00 → 19:00`); the other 24 are **Not Started**. No statuses are fabricated — the sheet records no Select/Reject decisions, so none are shown.

---

## 5. Features

**Dashboard** (`/`)
- Stat cards: Total, Running, Time Up, Submitted, Selected, Rejected
- Table: Candidate, Challenge, Start, End, **live Remaining countdown**, Status, Actions
- Search by **name / email / phone**
- Filter by **Running / Time Up / Submitted / Selected / Rejected / Absent / Not Started**
- Sort by **Remaining time / Start time / End time / Name**
- Auto-refreshes data every 15s; timers tick every second

**Add Candidate** (`/candidates/new`)
- All candidate fields + optional challenge assignment

**Start Challenge**
- Stores the current timestamp, computes `end = start + 5h`, flips status to **Running**. If no challenge is assigned yet, a dialog asks which one.

**Candidate detail** (`/candidates/[id]`)
- Full candidate information, challenge info, large live countdown
- Status controls: **Mark Submitted / Selected / Rejected / Absent**
- Alert banners for < 30 minutes left and time-up

**Import Excel** (`/import`)
- Drag-and-drop the original workbook; columns are auto-mapped by header, challenge names normalized, batches preserved, and duplicates (by email) skipped.

---

## 6. Project structure

```
app/
  page.tsx                     Dashboard
  candidates/new/page.tsx      Add candidate
  candidates/[id]/page.tsx     Candidate detail
  import/page.tsx              Excel import
  api/
    candidates/                list / create / get / update / delete
    candidates/[id]/start/     start the 5-hour timer
    candidates/[id]/status/    manual status changes
    challenges/                challenge catalog
    stats/                     dashboard counters
    import/                    Excel upload + parse
components/                    dashboard, detail, forms, status badge, countdown, app shell
lib/
  prisma.ts                    Prisma client (libSQL adapter)
  time.ts                      countdown / status / alert helpers
  store.ts                     Zustand clock + dashboard UI state
  import-excel.ts              header-based Excel parser
  challenge-utils.ts           challenge-name normalization
prisma/
  schema.prisma                data model
  seed.ts                      sample data
```

---

## 7. Why timers survive refresh & restart

Only **timestamps** (`startedAt`, `endsAt`) are persisted. A single Zustand clock updates `now` once per second; each countdown renders `endsAt − now`. Nothing is accumulated client-side, so reloading the page or reopening the browser shows the correct remaining time — it is recomputed from the database every time.
