import type { CandidateDTO, ChallengeDTO, StatsDTO, StoredStatus } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  candidates: () => fetch("/api/candidates", { cache: "no-store" }).then(json<CandidateDTO[]>),

  candidate: (id: string) =>
    fetch(`/api/candidates/${id}`, { cache: "no-store" }).then(json<CandidateDTO>),

  stats: () => fetch("/api/stats", { cache: "no-store" }).then(json<StatsDTO>),

  challenges: () => fetch("/api/challenges", { cache: "no-store" }).then(json<ChallengeDTO[]>),

  createCandidate: (data: Record<string, unknown>) =>
    fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(json<CandidateDTO>),

  createChallenge: (data: { name: string; description?: string; durationMinutes?: number }) =>
    fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(json<ChallengeDTO>),

  startChallenge: (id: string, challengeId?: string) =>
    fetch(`/api/candidates/${id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    }).then(json<CandidateDTO>),

  setStatus: (id: string, status: StoredStatus, note?: string) =>
    fetch(`/api/candidates/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }).then(json<CandidateDTO>),

  deleteCandidate: (id: string) =>
    fetch(`/api/candidates/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>),

  importExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch("/api/import", { method: "POST", body: fd }).then(
      json<{ created: number; skipped: number; batches: string[]; total: number }>,
    );
  },
};
