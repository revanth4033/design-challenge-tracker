import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serialize";
import { CHALLENGE_DURATION_MINUTES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Start (or restart) a candidate's challenge.
 * - Saves the current timestamp as startedAt
 * - Computes endsAt = startedAt + challenge duration (default 5h)
 * - Sets status to RUNNING
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { challenge: true },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Allow assigning / overriding the challenge when starting.
  const challengeId: string | null = body.challengeId ?? candidate.challengeId;
  if (!challengeId) {
    return NextResponse.json(
      { error: "Assign a challenge type before starting." },
      { status: 400 },
    );
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  const duration = challenge?.durationMinutes ?? CHALLENGE_DURATION_MINUTES;

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + duration * 60_000);

  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      challengeId,
      startedAt,
      endsAt,
      status: "RUNNING",
      history: {
        create: {
          fromStatus: candidate.status,
          toStatus: "RUNNING",
          note: "Challenge started",
        },
      },
    },
    include: { challenge: true },
  });

  return NextResponse.json(serializeCandidate(updated));
}
