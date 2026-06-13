import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/time";
import type { StatsDTO, StoredStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    select: { status: true, endsAt: true },
  });

  const now = Date.now();
  const stats: StatsDTO = {
    total: candidates.length,
    running: 0,
    completed: 0,
    submitted: 0,
    selected: 0,
    rejected: 0,
    absent: 0,
    notStarted: 0,
  };

  for (const c of candidates) {
    const eff = effectiveStatus(
      c.status as StoredStatus,
      c.endsAt ? c.endsAt.toISOString() : null,
      now,
    );
    switch (eff) {
      case "RUNNING":
        stats.running++;
        break;
      case "COMPLETED":
        stats.completed++;
        break;
      case "SUBMITTED":
        stats.submitted++;
        break;
      case "SELECTED":
        stats.selected++;
        break;
      case "REJECTED":
        stats.rejected++;
        break;
      case "ABSENT":
        stats.absent++;
        break;
      case "NOT_STARTED":
        stats.notStarted++;
        break;
    }
  }

  return NextResponse.json(stats);
}
