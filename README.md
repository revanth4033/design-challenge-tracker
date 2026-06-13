# Design Challenge Tracker

A simple, polished internal tool for running **timed UI/UX design challenges**. Every candidate gets a **5-hour window**; the dashboard shows a **live countdown** for each one. Built to feel like a modern SaaS admin dashboard (Linear / Stripe / Vercel).

**No database, no server, no setup.** The candidate list comes straight from your sheet (baked into the app), and everything you do — start a timer, change a status, add or import candidates — is saved in your **browser's local storage**. That means it deploys to Vercel (or anywhere) as a plain static site with zero configuration.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

That's it. The dashboard opens pre-loaded with the 40 candidates from `Final Selected Candidates.xlsx`.

### Deploy to Vercel

Push to GitHub and import the repo in Vercel — no environment variables, no database to provision. The default build (`next build`) just works.

---

## How the data works

- The **40 real candidates** from the sheet are embedded in `lib/seed-data.json` and loaded on first visit.
- The 16 marked **Present** with a recorded start time begin as **Running**, anchored to today at their start time (e.g. `2:00 PM → 7:00 PM`). The other 24 are **Not Started**. No Select/Reject statuses are invented — the sheet records none.
- Every change is persisted to `localStorage` (key `design-challenge-tracker`), so it survives refresh and browser restart.
- Timers are always computed as `endsAt − now` from stored timestamps — never accumulated in the browser — so countdowns stay correct after a reload.

> Data lives in **this browser**. It is per-device (not shared across machines) and clearing site data resets it to the sheet.

---

## Features

**Dashboard** (`/`)
- Stat cards: Total, Running, Time Up, Submitted, Selected, Rejected
- Table: Candidate, Challenge, Start, End, **live Remaining countdown**, Status, Actions
- Search by name / email / phone · filter by status · sort by remaining / start / end / name
- Color-coded badges: green (running), orange (< 1h left), red (time up), blue (submitted), green (selected), gray (absent). Rows flag amber under 30 min and red when expired.

**Start Challenge** — stores the current time, sets `end = start + 5h`, flips to Running. If no challenge is assigned, a dialog asks which one.

**Candidate detail** (`/candidates/[id]`) — full info, large live countdown, status controls (Submitted / Selected / Rejected / Absent), and alert banners for < 30 min and time-up.

**Add candidate** (`/candidates/new`) — all fields + optional challenge.

**Import Excel** (`/import`) — drag in a workbook; columns are mapped by header (handles the differing batch layouts), challenge names normalized, batches preserved, duplicates skipped. Parsed entirely in the browser.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — exported as a static client app
- **Tailwind CSS v4** + **shadcn/ui** (Base UI, Nova preset) + **Lucide** icons
- **Zustand** (with `persist`) — the single source of truth, saved to local storage, plus a 1-second clock that drives the countdowns
- **SheetJS (`xlsx`)** — client-side Excel import

No authentication, no backend — single-user internal tool by design.

---

## Project structure

```
app/
  page.tsx                  Dashboard
  candidates/new/page.tsx   Add candidate
  candidates/[id]/page.tsx  Candidate detail
  import/page.tsx           Excel import
components/                 dashboard, detail, forms, status badge, countdown, app shell
lib/
  store.ts                  Zustand store (persisted) + clock + UI state
  seed-data.json            the 40 real candidates from the sheet
  seed-data.ts              builds the initial state from the sheet
  time.ts                   countdown / status / alert helpers
  import-excel.ts           header-based Excel parser (browser)
  challenge-utils.ts        challenge-name normalization
```

### Resetting / changing the seed

To change the starting candidate list, edit `lib/seed-data.json`. To wipe local changes and reload from the sheet, clear the site's local storage (or use the browser devtools → Application → Local Storage).
