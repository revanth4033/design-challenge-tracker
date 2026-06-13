// Shared domain types for the Design Challenge Tracker.

/** Status values stored in the database. */
export const STORED_STATUSES = [
  "NOT_STARTED",
  "RUNNING",
  "SUBMITTED",
  "ON_HOLD",
  "SELECTED",
  "REJECTED",
  "ABSENT",
] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];

/**
 * Effective status shown in the UI. "COMPLETED" is derived (never stored):
 * a RUNNING candidate whose endsAt has passed is COMPLETED.
 */
export type EffectiveStatus = StoredStatus | "COMPLETED";

export const CHALLENGE_DURATION_MINUTES = 300; // 5 hours

/** Plain candidate shape returned by the API (dates serialized to ISO strings). */
export interface CandidateDTO {
  id: string;
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
  challengeId: string | null;
  challenge: ChallengeDTO | null;
  status: StoredStatus;
  startedAt: string | null;
  endsAt: string | null;
  /** Interviewer's free-text feedback on the candidate's submission. */
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  active: boolean;
}

export interface StatsDTO {
  total: number;
  running: number;
  completed: number;
  submitted: number;
  selected: number;
  rejected: number;
  absent: number;
  notStarted: number;
}

export interface DashboardStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
}
