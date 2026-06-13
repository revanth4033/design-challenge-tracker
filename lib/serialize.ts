import type { CandidateDTO, ChallengeDTO, StoredStatus } from "./types";

// Loose shapes — Prisma's generated types vary, we only need these fields.
interface ChallengeRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  active: boolean;
}

interface CandidateRow {
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
  challenge?: ChallengeRow | null;
  status: string;
  startedAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeChallenge(c: ChallengeRow): ChallengeDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    durationMinutes: c.durationMinutes,
    active: c.active,
  };
}

export function serializeCandidate(c: CandidateRow): CandidateDTO {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    mobile: c.mobile,
    designation: c.designation,
    totalExperience: c.totalExperience,
    relevantExperience: c.relevantExperience,
    location: c.location,
    noticePeriod: c.noticePeriod,
    portfolioUrl: c.portfolioUrl,
    resumeUrl: c.resumeUrl,
    batch: c.batch,
    challengeId: c.challengeId,
    challenge: c.challenge ? serializeChallenge(c.challenge) : null,
    status: c.status as StoredStatus,
    startedAt: c.startedAt ? c.startedAt.toISOString() : null,
    endsAt: c.endsAt ? c.endsAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
