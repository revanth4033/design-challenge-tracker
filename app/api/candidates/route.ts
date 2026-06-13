import { NextResponse } from "next/server";
import { listCandidates, upsertCandidates } from "@/lib/db";
import type { CandidateDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Unexpected error";
}

export async function GET() {
  try {
    const candidates = await listCandidates();
    return NextResponse.json({ candidates });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const list: CandidateDTO[] = body.candidates ?? (body.candidate ? [body.candidate] : []);
    await upsertCandidates(list);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
