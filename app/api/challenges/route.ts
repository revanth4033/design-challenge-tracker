import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeChallenge } from "@/lib/serialize";
import { slugify } from "@/lib/challenge-utils";
import { CHALLENGE_DURATION_MINUTES } from "@/lib/types";

export async function GET() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(challenges.map(serializeChallenge));
}

export async function POST(request: Request) {
  const body = await request.json();
  const name: string = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Challenge name is required" }, { status: 400 });
  }

  const existing = await prisma.challenge.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json(serializeChallenge(existing));
  }

  const challenge = await prisma.challenge.create({
    data: {
      name,
      slug: slugify(name),
      description: body.description ?? null,
      durationMinutes: Number(body.durationMinutes) || CHALLENGE_DURATION_MINUTES,
    },
  });
  return NextResponse.json(serializeChallenge(challenge), { status: 201 });
}
