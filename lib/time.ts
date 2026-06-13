import type { CandidateDTO, EffectiveStatus, StoredStatus } from "./types";

/**
 * Compute the effective status of a candidate at a given moment.
 * The only derived state is COMPLETED (RUNNING + time elapsed).
 */
export function effectiveStatus(
  status: StoredStatus,
  endsAt: string | null,
  now: number,
): EffectiveStatus {
  if (status === "RUNNING" && endsAt) {
    if (now >= new Date(endsAt).getTime()) return "COMPLETED";
  }
  return status;
}

/** Milliseconds remaining until endsAt. Negative once expired. */
export function remainingMs(endsAt: string | null, now: number): number | null {
  if (!endsAt) return null;
  return new Date(endsAt).getTime() - now;
}

/** Format a millisecond duration as HH:MM:SS (clamped at 00:00:00). */
export function formatCountdown(ms: number | null): string {
  if (ms === null) return "—";
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Human-readable time of day, e.g. "2:30 PM". */
export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Date + time, e.g. "Jun 13, 2:30 PM". */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Alert levels for a running candidate based on time left. */
export type AlertLevel = "none" | "warning" | "critical" | "expired";

export function alertLevel(
  status: StoredStatus,
  endsAt: string | null,
  now: number,
): AlertLevel {
  if (status !== "RUNNING" || !endsAt) return "none";
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "expired";
  if (ms <= 30 * 60 * 1000) return "critical"; // < 30 min
  if (ms <= 60 * 60 * 1000) return "warning"; // < 1 hour
  return "none";
}

/** Sort comparator for the dashboard. */
export function compareCandidates(
  a: CandidateDTO,
  b: CandidateDTO,
  sortBy: "remaining" | "startTime" | "endTime" | "name",
): number {
  switch (sortBy) {
    case "name":
      return a.name.localeCompare(b.name);
    case "startTime":
      return sortNullableDate(a.startedAt, b.startedAt);
    case "endTime":
      return sortNullableDate(a.endsAt, b.endsAt);
    case "remaining": {
      // Running first (by least time remaining), then everyone else by name.
      const ar = a.endsAt ? new Date(a.endsAt).getTime() : Infinity;
      const br = b.endsAt ? new Date(b.endsAt).getTime() : Infinity;
      if (ar === br) return a.name.localeCompare(b.name);
      return ar - br;
    }
  }
}

function sortNullableDate(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}
