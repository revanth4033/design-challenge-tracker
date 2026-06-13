import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { challenge: true },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  return NextResponse.json(serializeCandidate(candidate));
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  const fields = [
    "name",
    "email",
    "mobile",
    "designation",
    "totalExperience",
    "relevantExperience",
    "location",
    "noticePeriod",
    "portfolioUrl",
    "resumeUrl",
    "batch",
    "challengeId",
  ];
  for (const f of fields) {
    if (f in body) data[f] = body[f] === "" ? null : body[f];
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data,
    include: { challenge: true },
  });
  return NextResponse.json(serializeCandidate(candidate));
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
