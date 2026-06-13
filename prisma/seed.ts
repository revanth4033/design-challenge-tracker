import "dotenv/config";
import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";
import { CANONICAL_CHALLENGES } from "../lib/challenge-utils";

function dbUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (raw.startsWith("file:")) {
    const p = raw.slice(5);
    return p.startsWith("/") ? raw : "file:" + path.join(process.cwd(), p);
  }
  return raw;
}

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: dbUrl() }) });

const MIN = 60_000;
const DURATION = 300; // minutes (5h)

// `startedMinsAgo` produces realistic live timers across the visual states.
type Seed = {
  name: string;
  email: string;
  mobile: string;
  designation: string;
  totalExperience: string;
  relevantExperience: string;
  location: string;
  noticePeriod: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  batch: string;
  challenge: string; // canonical name
  status: "NOT_STARTED" | "RUNNING" | "SUBMITTED" | "SELECTED" | "REJECTED" | "ABSENT";
  startedMinsAgo?: number;
};

// Names/fields drawn from the original "Final Selected Candidates" workbook.
const SEEDS: Seed[] = [
  // RUNNING — fresh (≈4h50m left → green)
  {
    name: "Madhuvani Budarapu",
    email: "madhuu.work@gmail.com",
    mobile: "7799118566",
    designation: "UX Designer",
    totalExperience: "1 yr",
    relevantExperience: "1 yr",
    location: "Hyderabad",
    noticePeriod: "30 days",
    portfolioUrl: "https://kasbu.bio/madhuuwork",
    batch: "Batch 1",
    challenge: "Hotel POS",
    status: "RUNNING",
    startedMinsAgo: 10,
  },
  // RUNNING — warning (≈50m left → orange)
  {
    name: "Myla Jyothi Prakash Naidu",
    email: "mjprakashuiux@gmail.com",
    mobile: "7702458512",
    designation: "Software Engineer UI/UX",
    totalExperience: "5 yrs",
    relevantExperience: "4.5 yrs",
    location: "Hyderabad",
    noticePeriod: "60 days",
    portfolioUrl: "https://tinyurl.com/JP-UI-UX-Portfolio",
    batch: "Batch 1",
    challenge: "Hotel Raw Management",
    status: "RUNNING",
    startedMinsAgo: 250,
  },
  // RUNNING — critical (≈18m left → orange + alert)
  {
    name: "Swapna Vasam",
    email: "swapnaavasam416@gmail.com",
    mobile: "9063908033",
    designation: "UI/UX Designer",
    totalExperience: "4.6 yrs",
    relevantExperience: "4.6 yrs",
    location: "Hyderabad",
    noticePeriod: "Immediate",
    portfolioUrl: "https://www.behance.net/swapnavasam",
    batch: "Batch 4",
    challenge: "Hotel POS",
    status: "RUNNING",
    startedMinsAgo: 282,
  },
  // RUNNING — expired (time up → red / COMPLETED)
  {
    name: "Gopichandh Talluri",
    email: "gopichandtlr@gmail.com",
    mobile: "7013691121",
    designation: "Sr UI/UX & Visual Designer",
    totalExperience: "6 yrs",
    relevantExperience: "6 yrs",
    location: "Hyderabad",
    noticePeriod: "30 days",
    portfolioUrl: "https://www.behance.net/gopichandtalluri",
    batch: "Batch 3",
    challenge: "Hotel Raw Management",
    status: "RUNNING",
    startedMinsAgo: 312,
  },
  // SUBMITTED
  {
    name: "Taufeeq Hussain",
    email: "tau.hussain1i@gmail.com",
    mobile: "9908463612",
    designation: "Sr Product Designer",
    totalExperience: "8 yrs",
    relevantExperience: "8 yrs",
    location: "Hyderabad",
    noticePeriod: "15 days",
    portfolioUrl: "https://taufeeq.in/",
    batch: "Batch 2",
    challenge: "Hotel POS",
    status: "SUBMITTED",
    startedMinsAgo: 360,
  },
  {
    name: "Manasa Ragula",
    email: "manasaragula0000@gmail.com",
    mobile: "9700856752",
    designation: "UI/UX Designer",
    totalExperience: "3 yrs",
    relevantExperience: "3 yrs",
    location: "Hyderabad",
    noticePeriod: "Immediate",
    portfolioUrl: "https://www.behance.net/manasaragula123",
    batch: "Batch 3",
    challenge: "Hotel Raw Management",
    status: "SUBMITTED",
    startedMinsAgo: 380,
  },
  // SELECTED
  {
    name: "Rajesh Salipalli",
    email: "rajesh.saliapalli@gmail.com",
    mobile: "7207306694",
    designation: "Creative Head",
    totalExperience: "15 yrs",
    relevantExperience: "15 yrs",
    location: "Hyderabad",
    noticePeriod: "30 days",
    batch: "Batch 2",
    challenge: "Hotel POS",
    status: "SELECTED",
    startedMinsAgo: 420,
  },
  {
    name: "Vamsi Adurthy",
    email: "vamsi.adurthy@gmail.com",
    mobile: "7731898802",
    designation: "Product Designer",
    totalExperience: "5 yrs",
    relevantExperience: "5 yrs",
    location: "Hyderabad",
    noticePeriod: "60 days",
    portfolioUrl: "https://vamsiadurthy.com/",
    batch: "Batch 4",
    challenge: "Hotel Raw Management",
    status: "SELECTED",
    startedMinsAgo: 500,
  },
  // REJECTED
  {
    name: "Swapnil Banubakode",
    email: "swapnil.banubakode21@gmail.com",
    mobile: "9503535737",
    designation: "Sr Product Designer",
    totalExperience: "9 yrs",
    relevantExperience: "5 yrs",
    location: "Hyderabad",
    noticePeriod: "30 days",
    portfolioUrl: "https://www.behance.net/swapbanu27eac",
    batch: "Batch 4",
    challenge: "Hotel POS",
    status: "REJECTED",
    startedMinsAgo: 520,
  },
  // ABSENT
  {
    name: "Mohammed Muzammil Ahamed",
    email: "muzammil.sr41@gmail.com",
    mobile: "8688710604",
    designation: "Sr Software Engineer",
    totalExperience: "8.1 yrs",
    relevantExperience: "8.1 yrs",
    location: "Hyderabad",
    noticePeriod: "Immediate",
    batch: "Batch 2",
    challenge: "Hotel POS",
    status: "ABSENT",
  },
  // NOT_STARTED (assigned, ready to start)
  {
    name: "Naresh Aalapaka",
    email: "naresh.uiux124@gmail.com",
    mobile: "7075065094",
    designation: "Sr UI/UX Designer",
    totalExperience: "5 yrs",
    relevantExperience: "5 yrs",
    location: "Hyderabad",
    noticePeriod: "Immediate",
    portfolioUrl: "https://www.behance.net/nareshaalapaka",
    batch: "Batch 3",
    challenge: "Hotel Raw Management",
    status: "NOT_STARTED",
  },
  {
    name: "Mansi Thakur",
    email: "mansithakurr98@gmail.com",
    mobile: "8897904991",
    designation: "UX Designer",
    totalExperience: "6.4 yrs",
    relevantExperience: "2 yrs",
    location: "Hyderabad",
    noticePeriod: "Immediate",
    portfolioUrl: "https://mansithakur.framer.website/",
    batch: "Batch 1",
    challenge: "Hotel POS",
    status: "NOT_STARTED",
  },
];

async function main() {
  console.log("Seeding challenges…");
  const challengeByName = new Map<string, string>();
  for (const c of CANONICAL_CHALLENGES) {
    const challenge = await prisma.challenge.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        durationMinutes: DURATION,
      },
    });
    challengeByName.set(c.name, challenge.id);
  }

  console.log("Seeding candidates…");
  // Reset candidates for a clean, repeatable demo state.
  await prisma.statusHistory.deleteMany();
  await prisma.candidate.deleteMany();

  const now = Date.now();
  for (const s of SEEDS) {
    const challengeId = challengeByName.get(s.challenge) ?? null;
    let startedAt: Date | null = null;
    let endsAt: Date | null = null;
    if (s.startedMinsAgo != null) {
      startedAt = new Date(now - s.startedMinsAgo * MIN);
      endsAt = new Date(startedAt.getTime() + DURATION * MIN);
    }
    await prisma.candidate.create({
      data: {
        name: s.name,
        email: s.email,
        mobile: s.mobile,
        designation: s.designation,
        totalExperience: s.totalExperience,
        relevantExperience: s.relevantExperience,
        location: s.location,
        noticePeriod: s.noticePeriod,
        portfolioUrl: s.portfolioUrl ?? null,
        resumeUrl: s.resumeUrl ?? null,
        batch: s.batch,
        challengeId,
        status: s.status,
        startedAt,
        endsAt,
      },
    });
  }

  const count = await prisma.candidate.count();
  console.log(`Done. ${count} candidates, ${challengeByName.size} challenge types.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
