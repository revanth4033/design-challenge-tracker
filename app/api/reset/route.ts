import { NextResponse } from "next/server";
import { resetToSheet } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Wipe and re-seed all candidates from the sheet. Destructive. */
export async function POST() {
  try {
    await resetToSheet();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
