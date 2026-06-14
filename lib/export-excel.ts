import * as XLSX from "xlsx";
import { alertLevel, effectiveStatus, formatCountdown, formatDateTime, remainingMs } from "./time";
import { statusDisplay } from "./status-display";
import type { CandidateDTO } from "./types";

/**
 * Export the given candidates to a downloadable .xlsx, capturing everything
 * shown on the dashboard — status, feedback, timings, etc. Runs in the browser.
 */
export function exportCandidatesToExcel(candidates: CandidateDTO[], now: number): void {
  const rows = candidates.map((c) => {
    const eff = effectiveStatus(c.status, c.endsAt, now);
    const alert = alertLevel(c.status, c.endsAt, now);
    const ms = remainingMs(c.endsAt, now);
    return {
      Name: c.name,
      Email: c.email,
      Mobile: c.mobile,
      Designation: c.designation ?? "",
      "Total Experience": c.totalExperience ?? "",
      "Relevant Experience": c.relevantExperience ?? "",
      Location: c.location ?? "",
      "Notice Period": c.noticePeriod ?? "",
      Batch: c.batch ?? "",
      Challenge: c.challenge?.name ?? "",
      "Start Time": c.startedAt ? formatDateTime(c.startedAt) : "",
      "End Time": c.endsAt ? formatDateTime(c.endsAt) : "",
      Remaining: c.status === "RUNNING" && ms !== null && ms > 0 ? formatCountdown(ms) : "",
      Status: statusDisplay(eff, alert).label,
      Feedback: c.feedback ?? "",
      "Portfolio URL": c.portfolioUrl ?? "",
      "Resume URL": c.resumeUrl ?? "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 24 }, // Name
    { wch: 28 }, // Email
    { wch: 14 }, // Mobile
    { wch: 22 }, // Designation
    { wch: 16 }, // Total Experience
    { wch: 16 }, // Relevant Experience
    { wch: 14 }, // Location
    { wch: 14 }, // Notice Period
    { wch: 10 }, // Batch
    { wch: 22 }, // Challenge
    { wch: 18 }, // Start Time
    { wch: 18 }, // End Time
    { wch: 12 }, // Remaining
    { wch: 16 }, // Status
    { wch: 50 }, // Feedback
    { wch: 42 }, // Portfolio URL
    { wch: 42 }, // Resume URL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  XLSX.writeFile(wb, `design-challenge-candidates-${stamp}.xlsx`);
}
