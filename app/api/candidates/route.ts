import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    include: { challenge: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(candidates.map(serializeCandidate));
}

export async function POST(request: Request) {
  const body = await request.json();

  const name: string = (body.name ?? "").trim();
  const email: string = (body.email ?? "").trim();
  const mobile: string = (body.mobile ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
  }

  // challengeId is optional at creation; the timer starts via /start.
  let challengeId: string | null = body.challengeId || null;
  if (challengeId) {
    const exists = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!exists) challengeId = null;
  }

  const candidate = await prisma.candidate.create({
    data: {
      name,
      email,
      mobile,
      designation: body.designation || null,
      totalExperience: body.totalExperience || null,
      relevantExperience: body.relevantExperience || null,
      location: body.location || null,
      noticePeriod: body.noticePeriod || null,
      portfolioUrl: body.portfolioUrl || null,
      resumeUrl: body.resumeUrl || null,
      batch: body.batch || null,
      challengeId,
      status: "NOT_STARTED",
    },
    include: { challenge: true },
  });

  return NextResponse.json(serializeCandidate(candidate), { status: 201 });
}
