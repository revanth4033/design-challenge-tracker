import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWorkbook } from "@/lib/import-excel";
import { slugify } from "@/lib/challenge-utils";
import { CHALLENGE_DURATION_MINUTES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Import candidates from an uploaded Excel workbook.
 * Maps columns by header, normalizes challenge names, preserves batch labels,
 * and find-or-creates the referenced challenge types.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let parsed;
  try {
    parsed = parseWorkbook(buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read the Excel file. Make sure it is a valid .xlsx." },
      { status: 400 },
    );
  }

  if (parsed.candidates.length === 0) {
    return NextResponse.json(
      { error: "No candidate rows found in the workbook." },
      { status: 400 },
    );
  }

  // Resolve challenge types (find-or-create), cached by name.
  const challengeCache = new Map<string, string>();
  async function resolveChallenge(name: string | null): Promise<string | null> {
    if (!name) return null;
    if (challengeCache.has(name)) return challengeCache.get(name)!;
    let challenge = await prisma.challenge.findFirst({ where: { name } });
    if (!challenge) {
      challenge = await prisma.challenge.create({
        data: { name, slug: slugify(name), durationMinutes: CHALLENGE_DURATION_MINUTES },
      });
    }
    challengeCache.set(name, challenge.id);
    return challenge.id;
  }

  let created = 0;
  let skipped = 0;

  for (const c of parsed.candidates) {
    // De-dupe on email when present, otherwise on name + batch.
    const existing = c.email
      ? await prisma.candidate.findFirst({ where: { email: c.email } })
      : await prisma.candidate.findFirst({ where: { name: c.name, batch: c.batch } });

    if (existing) {
      skipped++;
      continue;
    }

    const challengeId = await resolveChallenge(c.challengeName);
    await prisma.candidate.create({
      data: {
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
        challengeId,
        status: c.status,
      },
    });
    created++;
  }

  return NextResponse.json({
    created,
    skipped,
    batches: parsed.batches,
    total: parsed.candidates.length,
  });
}
