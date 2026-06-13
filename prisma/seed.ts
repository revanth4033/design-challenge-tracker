import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";
import { CANONICAL_CHALLENGES, slugify } from "../lib/challenge-utils";

function dbUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (raw.startsWith("file:")) {
    const p = raw.slice(5);
    return p.startsWith("/") ? raw : "file:" + path.join(process.cwd(), p);
  }
  return raw;
}

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: dbUrl() }) });

const DURATION = 300; // minutes (5h)
const MIN = 60_000;

// Real candidate records extracted verbatim from "Final Selected Candidates.xlsx".
// (40 candidates across 4 batches; 16 were Present with a challenge + start time.)
interface SeedRecord {
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
  startTime: string | null; // "HH:MM" time of day, no date
}

function loadRecords(): SeedRecord[] {
  const file = path.join(process.cwd(), "prisma", "seed-data.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as SeedRecord[];
}

/** Build a Date for today at the given "HH:MM" local time. */
function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const records = loadRecords();

  console.log("Seeding challenges…");
  const challengeByName = new Map<string, string>();
  for (const c of CANONICAL_CHALLENGES) {
    const challenge = await prisma.challenge.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { name: c.name, slug: c.slug, description: c.description, durationMinutes: DURATION },
    });
    challengeByName.set(c.name, challenge.id);
  }
  async function resolveChallenge(name: string | null): Promise<string | null> {
    if (!name) return null;
    if (challengeByName.has(name)) return challengeByName.get(name)!;
    const created = await prisma.challenge.create({
      data: { name, slug: slugify(name), durationMinutes: DURATION },
    });
    challengeByName.set(name, created.id);
    return created.id;
  }

  console.log("Resetting candidates…");
  await prisma.statusHistory.deleteMany();
  await prisma.candidate.deleteMany();

  console.log(`Seeding ${records.length} candidates…`);
  let running = 0;
  for (const r of records) {
    const challengeId = await resolveChallenge(r.challenge);

    // Present candidates with a recorded start time are treated as live runs
    // anchored to today; everyone else is awaiting a start.
    let startedAt: Date | null = null;
    let endsAt: Date | null = null;
    let status = "NOT_STARTED";
    if (r.present && r.startTime) {
      startedAt = todayAt(r.startTime);
      endsAt = new Date(startedAt.getTime() + DURATION * MIN);
      status = "RUNNING";
      running++;
    }

    await prisma.candidate.create({
      data: {
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
        challengeId,
        status,
        startedAt,
        endsAt,
      },
    });
  }

  const total = await prisma.candidate.count();
  console.log(
    `Done. ${total} candidates (${running} started/running, ${total - running} not started), ` +
      `${challengeByName.size} challenge types.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
