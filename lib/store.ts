import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { initialCandidates, initialChallenges } from "./seed-data";
import { slugify } from "./challenge-utils";
import {
  CHALLENGE_DURATION_MINUTES,
  type CandidateDTO,
  type ChallengeDTO,
  type StoredStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Global clock — drives countdown re-renders. Timers are always computed from
// stored timestamps, so they stay correct across refresh and restart.
// ---------------------------------------------------------------------------
interface ClockState {
  now: number;
  tick: () => void;
}
export const useClock = create<ClockState>((set) => ({
  now: 0,
  tick: () => set({ now: Date.now() }),
}));

// ---------------------------------------------------------------------------
// Tracker store — candidates + challenges, persisted to localStorage.
// No database, no server: the known sheet data is the seed, and every change
// (start, status, add, import) is saved in the browser.
// ---------------------------------------------------------------------------
export interface NewCandidateInput {
  name: string;
  email?: string;
  mobile?: string;
  designation?: string;
  totalExperience?: string;
  relevantExperience?: string;
  location?: string;
  noticePeriod?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  batch?: string;
  challengeId?: string | null;
}

export interface ImportedCandidate {
  name: string;
  email: string;
  mobile: string;
  designation: string | null;
  totalExperience: string | null;
  relevantExperience: string | null;
  location: string | null;
  noticePeriod: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  batch: string | null;
  challengeName: string | null;
  status: StoredStatus;
}

interface TrackerState {
  candidates: CandidateDTO[];
  challenges: ChallengeDTO[];
  startChallenge: (id: string, challengeId?: string) => void;
  setStatus: (id: string, status: StoredStatus) => void;
  clearStatus: (id: string) => void;
  addCandidate: (input: NewCandidateInput) => CandidateDTO;
  deleteCandidate: (id: string) => void;
  importCandidates: (rows: ImportedCandidate[]) => { created: number; skipped: number };
  resetToSheet: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cand-${Math.floor(Math.random() * 1e9)}-${Date.now()}`;
}

export const useTracker = create<TrackerState>()(
  persist(
    (set, get) => ({
      candidates: initialCandidates(),
      challenges: initialChallenges(),

      startChallenge: (id, challengeId) => {
        const challenges = get().challenges;
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== id) return c;
            const chId = challengeId ?? c.challengeId;
            const challenge = challenges.find((x) => x.id === chId) ?? c.challenge ?? null;
            const duration = challenge?.durationMinutes ?? CHALLENGE_DURATION_MINUTES;
            const start = new Date();
            const end = new Date(start.getTime() + duration * 60_000);
            return {
              ...c,
              challengeId: challenge?.id ?? null,
              challenge,
              status: "RUNNING",
              startedAt: start.toISOString(),
              endsAt: end.toISOString(),
              updatedAt: start.toISOString(),
            };
          }),
        }));
      },

      setStatus: (id, status) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      // Clear a manual status, reverting to the timer-derived state:
      // Running if a timer exists, otherwise Not Started.
      clearStatus: (id) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: c.startedAt && c.endsAt ? "RUNNING" : "NOT_STARTED",
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      addCandidate: (input) => {
        const challenge =
          get().challenges.find((x) => x.id === input.challengeId) ?? null;
        const now = new Date().toISOString();
        const candidate: CandidateDTO = {
          id: newId(),
          name: input.name.trim(),
          email: input.email?.trim() ?? "",
          mobile: input.mobile?.trim() ?? "",
          designation: input.designation?.trim() || null,
          totalExperience: input.totalExperience?.trim() || null,
          relevantExperience: input.relevantExperience?.trim() || null,
          location: input.location?.trim() || null,
          noticePeriod: input.noticePeriod?.trim() || null,
          portfolioUrl: input.portfolioUrl?.trim() || null,
          resumeUrl: input.resumeUrl?.trim() || null,
          batch: input.batch?.trim() || null,
          challengeId: challenge?.id ?? null,
          challenge,
          status: "NOT_STARTED",
          startedAt: null,
          endsAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ candidates: [candidate, ...s.candidates] }));
        return candidate;
      },

      deleteCandidate: (id) =>
        set((s) => ({ candidates: s.candidates.filter((c) => c.id !== id) })),

      importCandidates: (rows) => {
        let created = 0;
        let skipped = 0;
        set((s) => {
          const candidates = [...s.candidates];
          const challenges = [...s.challenges];
          const now = new Date().toISOString();

          const findOrAddChallenge = (name: string | null): ChallengeDTO | null => {
            if (!name) return null;
            let ch = challenges.find((c) => c.name.toLowerCase() === name.toLowerCase());
            if (!ch) {
              ch = {
                id: slugify(name),
                name,
                slug: slugify(name),
                description: null,
                durationMinutes: CHALLENGE_DURATION_MINUTES,
                active: true,
              };
              challenges.push(ch);
            }
            return ch;
          };

          for (const r of rows) {
            const dupe = candidates.find((c) =>
              r.email
                ? c.email.toLowerCase() === r.email.toLowerCase()
                : c.name.toLowerCase() === r.name.toLowerCase() && c.batch === r.batch,
            );
            if (dupe) {
              skipped++;
              continue;
            }
            const challenge = findOrAddChallenge(r.challengeName);
            candidates.push({
              id: newId(),
              name: r.name,
              email: r.email,
              mobile: r.mobile,
              designation: r.designation,
              totalExperience: r.totalExperience,
              relevantExperience: r.relevantExperience,
              location: r.location,
              noticePeriod: r.noticePeriod,
              portfolioUrl: r.portfolioUrl,
              resumeUrl: r.resumeUrl,
              batch: r.batch,
              challengeId: challenge?.id ?? null,
              challenge,
              status: r.status,
              startedAt: null,
              endsAt: null,
              createdAt: now,
              updatedAt: now,
            });
            created++;
          }
          return { candidates, challenges };
        });
        return { created, skipped };
      },

      resetToSheet: () =>
        set({ candidates: initialCandidates(), challenges: initialChallenges() }),
    }),
    {
      name: "design-challenge-tracker",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (s) => ({ candidates: s.candidates, challenges: s.challenges }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Dashboard UI state (search / filter / sort) — ephemeral, not persisted.
// ---------------------------------------------------------------------------
export type StatusFilter = "ALL" | string;
export type SortKey = "remaining" | "startTime" | "endTime" | "name";

interface DashboardUiState {
  search: string;
  statusFilter: StatusFilter;
  sortBy: SortKey;
  setSearch: (v: string) => void;
  setStatusFilter: (v: StatusFilter) => void;
  setSortBy: (v: SortKey) => void;
}
export const useDashboardUi = create<DashboardUiState>((set) => ({
  search: "",
  statusFilter: "ALL",
  sortBy: "remaining",
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
