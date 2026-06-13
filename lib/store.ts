import { create } from "zustand";
import type { EffectiveStatus } from "./types";

export type StatusFilter = "ALL" | EffectiveStatus;
export type SortKey = "remaining" | "startTime" | "endTime" | "name";

interface ClockState {
  /** Current time in ms. Updated every second to drive countdown re-renders. */
  now: number;
  tick: () => void;
}

/**
 * Single global clock. Countdown values are ALWAYS computed from stored
 * startedAt/endsAt timestamps against this `now` — never accumulated in the
 * browser — so they remain correct across refresh and restart.
 */
export const useClock = create<ClockState>((set) => ({
  now: 0,
  tick: () => set({ now: Date.now() }),
}));

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
