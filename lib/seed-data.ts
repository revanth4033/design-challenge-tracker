import rawSeed from "./seed-data.json";
import { CANONICAL_CHALLENGES } from "./challenge-utils";
import { CHALLENGE_DURATION_MINUTES, type CandidateDTO, type ChallengeDTO } from "./types";

interface RawSeed {
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
  batch: string;
  present: boolean;
  challenge: string | null; // normalized challenge name
  startTime: string | null; // "HH:MM" local time of day, no date
}

const SEED = rawSeed as RawSeed[];

/** The fixed challenge catalog (Hotel POS, Hotel Raw Management). */
export function initialChallenges(): ChallengeDTO[] {
  return CANONICAL_CHALLENGES.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    description: c.description,
    durationMinutes: CHALLENGE_DURATION_MINUTES,
    active: true,
  }));
}

// The sheet's challenge times are Indian local times (the challenges run in
// Hyderabad). Seeding happens server-side on Vercel (UTC), so we anchor the
// "HH:MM" to today's date in IST (UTC+5:30) to get the correct absolute instant.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Build a Date for today at the given "HH:MM" Indian Standard Time. */
function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();
  // Desired IST wall-clock time converted back to a UTC instant.
  return new Date(Date.UTC(year, month, day, h, m ?? 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Build the initial candidate list from the real sheet data.
 * Candidates marked Present (with a recorded start time) start as RUNNING,
 * anchored to today at their recorded time; everyone else is NOT_STARTED.
 * This runs once on first load; afterwards persisted state takes over.
 */
export function initialCandidates(): CandidateDTO[] {
  const challenges = initialChallenges();
  const byName = new Map(challenges.map((c) => [c.name, c]));
  const nowIso = new Date().toISOString();

  return SEED.map((r, i) => {
    const challenge = r.challenge ? (byName.get(r.challenge) ?? null) : null;

    let startedAt: string | null = null;
    let endsAt: string | null = null;
    let status: CandidateDTO["status"] = "NOT_STARTED";

    if (r.present && r.startTime) {
      const start = todayAt(r.startTime);
      startedAt = start.toISOString();
      endsAt = new Date(start.getTime() + CHALLENGE_DURATION_MINUTES * 60_000).toISOString();
      status = "RUNNING";
    }

    return {
      id: `cand-${i + 1}`,
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
      status,
      startedAt,
      endsAt,
      feedback: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    } satisfies CandidateDTO;
  });
}
