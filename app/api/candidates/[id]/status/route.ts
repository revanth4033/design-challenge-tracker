import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serialize";
import { STORED_STATUSES, type StoredStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const MANUAL_STATUSES: StoredStatus[] = [
  "SUBMITTED",
  "SELECTED",
  "REJECTED",
  "ABSENT",
  "RUNNING",
  "NOT_STARTED",
];

/** Apply a manual status change (Submitted / Selected / Rejected / Absent). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();
  const status = body.status as StoredStatus;

  if (!STORED_STATUSES.includes(status) || !MANUAL_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      status,
      history: {
        create: {
          fromStatus: candidate.status,
          toStatus: status,
          note: body.note ?? null,
        },
      },
    },
    include: { challenge: true },
  });

  return NextResponse.json(serializeCandidate(updated));
}
