import { create } from "zustand";
import { initialChallenges } from "./seed-data";
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
// Tracker store — backed by a shared hosted database via /api/candidates.
// Mutations update local state optimistically and persist to the server; a
// background poll (SyncProvider) refreshes every few seconds so every device
// sees the same live board.
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
  loaded: boolean;
  error: string | null;
  syncFromServer: () => Promise<void>;
  startChallenge: (id: string, challengeId?: string) => void;
  setStatus: (id: string, status: StoredStatus) => void;
  clearStatus: (id: string) => void;
  setFeedback: (id: string, feedback: string) => void;
  addCandidate: (input: NewCandidateInput) => CandidateDTO;
  deleteCandidate: (id: string) => void;
  importCandidates: (rows: ImportedCandidate[]) => { created: number; skipped: number };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cand-${Math.floor(Math.random() * 1e9)}-${Date.now()}`;
}

// --- server persistence helpers (fire-and-forget; the poll reconciles) ------
async function apiUpsert(candidates: CandidateDTO[]): Promise<void> {
  try {
    await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates }),
    });
  } catch {
    // network hiccup — next poll will re-sync from the server
  }
}
async function apiDelete(id: string): Promise<void> {
  try {
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
  } catch {
    /* ignore */
  }
}

export const useTracker = create<TrackerState>((set, get) => ({
  candidates: [],
  challenges: initialChallenges(),
  loaded: false,
  error: null,

  syncFromServer: async () => {
    try {
      const res = await fetch("/api/candidates", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load");
      set({ candidates: body.candidates ?? [], loaded: true, error: null });
    } catch (e) {
      set({ loaded: true, error: e instanceof Error ? e.message : "Failed to load" });
    }
  },

  startChallenge: (id, challengeId) => {
    const challenges = get().challenges;
    let updated: CandidateDTO | undefined;
    set((s) => ({
      candidates: s.candidates.map((c) => {
        if (c.id !== id) return c;
        const chId = challengeId ?? c.challengeId;
        const challenge = challenges.find((x) => x.id === chId) ?? c.challenge ?? null;
        const duration = challenge?.durationMinutes ?? CHALLENGE_DURATION_MINUTES;
        const start = new Date();
        const end = new Date(start.getTime() + duration * 60_000);
        updated = {
          ...c,
          challengeId: challenge?.id ?? null,
          challenge,
          status: "RUNNING",
          startedAt: start.toISOString(),
          endsAt: end.toISOString(),
          updatedAt: start.toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) void apiUpsert([updated]);
  },

  setStatus: (id, status) => {
    let updated: CandidateDTO | undefined;
    set((s) => ({
      candidates: s.candidates.map((c) => {
        if (c.id !== id) return c;
        updated = { ...c, status, updatedAt: new Date().toISOString() };
        return updated;
      }),
    }));
    if (updated) void apiUpsert([updated]);
  },

  clearStatus: (id) => {
    let updated: CandidateDTO | undefined;
    set((s) => ({
      candidates: s.candidates.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c,
          status: c.startedAt && c.endsAt ? "RUNNING" : "NOT_STARTED",
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) void apiUpsert([updated]);
  },

  setFeedback: (id, feedback) => {
    let updated: CandidateDTO | undefined;
    set((s) => ({
      candidates: s.candidates.map((c) => {
        if (c.id !== id) return c;
        updated = { ...c, feedback: feedback.trim() || null, updatedAt: new Date().toISOString() };
        return updated;
      }),
    }));
    if (updated) void apiUpsert([updated]);
  },

  addCandidate: (input) => {
    const challenge = get().challenges.find((x) => x.id === input.challengeId) ?? null;
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
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ candidates: [candidate, ...s.candidates] }));
    void apiUpsert([candidate]);
    return candidate;
  },

  deleteCandidate: (id) => {
    set((s) => ({ candidates: s.candidates.filter((c) => c.id !== id) }));
    void apiDelete(id);
  },

  importCandidates: (rows) => {
    let created = 0;
    let skipped = 0;
    const fresh: CandidateDTO[] = [];
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
        const candidate: CandidateDTO = {
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
          feedback: null,
          createdAt: now,
          updatedAt: now,
        };
        candidates.push(candidate);
        fresh.push(candidate);
        created++;
      }
      return { candidates, challenges };
    });
    if (fresh.length) void apiUpsert(fresh);
    return { created, skipped };
  },
}));

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
