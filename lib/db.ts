import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { initialCandidates } from "./seed-data";
import type { CandidateDTO } from "./types";

// Shared hosted database (Neon Postgres). All devices read/write here, so the
// board is the same everywhere. Candidates are stored as JSONB blobs keyed by
// id — simple and flexible as the candidate shape evolves.

function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision a Neon Postgres database (Vercel → Storage) and it will be added automatically.",
    );
  }
  return neon(url);
}

let schemaReady = false;
async function ensureSchema(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

async function seedIfEmpty(sql: NeonQueryFunction<false, false>): Promise<void> {
  const rows = (await sql`SELECT count(*)::int AS n FROM candidates`) as { n: number }[];
  if (rows[0]?.n > 0) return;
  const seed = initialCandidates();
  // Idempotent seed: concurrent first-loads won't double-insert (stable ids).
  await sql.transaction(
    seed.map(
      (c) =>
        sql`INSERT INTO candidates (id, data) VALUES (${c.id}, ${JSON.stringify(c)}::jsonb)
            ON CONFLICT (id) DO NOTHING`,
    ),
  );
}

export async function listCandidates(): Promise<CandidateDTO[]> {
  const sql = getSql();
  await ensureSchema(sql);
  await seedIfEmpty(sql);
  const rows = (await sql`SELECT data FROM candidates ORDER BY created_at ASC, id ASC`) as {
    data: CandidateDTO;
  }[];
  return rows.map((r) => r.data);
}

export async function upsertCandidates(candidates: CandidateDTO[]): Promise<void> {
  if (candidates.length === 0) return;
  const sql = getSql();
  await ensureSchema(sql);
  await sql.transaction(
    candidates.map(
      (c) =>
        sql`INSERT INTO candidates (id, data) VALUES (${c.id}, ${JSON.stringify(c)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    ),
  );
}

export async function deleteCandidateRow(id: string): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await sql`DELETE FROM candidates WHERE id = ${id}`;
}

/** Wipe all candidates and re-seed from the sheet (with corrected timings). */
export async function resetToSheet(): Promise<void> {
  const sql = getSql();
  await ensureSchema(sql);
  await sql`DELETE FROM candidates`;
  const seed = initialCandidates();
  await sql.transaction(
    seed.map(
      (c) =>
        sql`INSERT INTO candidates (id, data) VALUES (${c.id}, ${JSON.stringify(c)}::jsonb)`,
    ),
  );
}
