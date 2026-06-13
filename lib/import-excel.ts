import * as XLSX from "xlsx";
import { normalizeChallengeName } from "./challenge-utils";
import type { StoredStatus } from "./types";

export interface ParsedCandidate {
  name: string;
  email: string;
  mobile: string;
  designation: string | null;
  totalExperience: string | null;
  relevantExperience: string | null;
  location: string | null;
  noticePeriod: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  batch: string | null;
  challengeName: string | null;
  status: StoredStatus;
}

export interface ParseResult {
  candidates: ParsedCandidate[];
  batches: string[];
  skipped: number;
}

// Maps a normalized header label to the candidate field. Matched by keyword so
// it tolerates the inconsistent column order between batch sheets.
function matchHeader(header: string): keyof ParsedCandidate | "present" | "timing" | null {
  const h = header.toLowerCase();
  if (h.includes("name") && !h.includes("task")) return "name";
  if (h.includes("email")) return "email";
  if (h.includes("mobile") || h.includes("phone")) return "mobile";
  if (h.includes("designation")) return "designation";
  if (h.includes("total") && h.includes("exp")) return "totalExperience";
  if (h.includes("relevant") && h.includes("exp")) return "relevantExperience";
  if (h.includes("location")) return "location";
  if (h.includes("notice")) return "noticePeriod";
  if (h.includes("portfolio")) return "portfolioUrl";
  if (h.includes("resume")) return "resumeUrl";
  if (h.includes("present") || h.includes("absent")) return "present";
  if (h.includes("task name") || h.includes("pos/raw")) return "challengeName";
  if (h.includes("timing")) return "timing";
  if (h.includes("task status") || h.includes("select")) return null; // ignored on import
  return null;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    // Mobile numbers arrive as floats (7.79e9) — render as plain digits.
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  return String(value).trim();
}

function formatMobile(value: unknown): string {
  if (typeof value === "number") {
    return Math.round(value).toString();
  }
  const s = String(value ?? "").trim();
  return s;
}

export function parseWorkbook(data: ArrayBuffer | Uint8Array): ParseResult {
  // Works in the browser (no Node Buffer): read raw bytes as an array.
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const wb = XLSX.read(bytes, { type: "array" });
  const candidates: ParsedCandidate[] = [];
  const batches = new Set<string>();
  let skipped = 0;

  for (const sheetName of wb.SheetNames) {
    // Skip summary / non-batch sheets.
    if (/total|count|summary/i.test(sheetName)) continue;
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    if (rows.length === 0) continue;

    // First row is the header; build column index -> field map.
    const headerRow = rows[0] as unknown[];
    const colMap = new Map<number, ReturnType<typeof matchHeader>>();
    headerRow.forEach((cell, idx) => {
      const field = matchHeader(cellToString(cell));
      if (field) colMap.set(idx, field);
    });

    const batchLabel = sheetName.trim();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] as unknown[];
      const record: Partial<Record<string, unknown>> = {};
      colMap.forEach((field, idx) => {
        record[field as string] = row[idx];
      });

      const name = cellToString(record["name"]);
      if (!name) {
        continue; // empty filler row
      }

      const presentRaw = cellToString(record["present"]).toLowerCase();
      let status: StoredStatus = "NOT_STARTED";
      if (presentRaw.includes("absent")) status = "ABSENT";

      const challengeName = normalizeChallengeName(cellToString(record["challengeName"]));

      candidates.push({
        name,
        email: cellToString(record["email"]),
        mobile: formatMobile(record["mobile"]),
        designation: emptyToNull(cellToString(record["designation"])),
        totalExperience: emptyToNull(cellToString(record["totalExperience"])),
        relevantExperience: emptyToNull(cellToString(record["relevantExperience"])),
        location: emptyToNull(cellToString(record["location"])),
        noticePeriod: emptyToNull(cellToString(record["noticePeriod"])),
        portfolioUrl: emptyToNull(cellToString(record["portfolioUrl"])),
        resumeUrl: emptyToNull(cellToString(record["resumeUrl"])),
        batch: batchLabel,
        challengeName,
        status,
      });
      batches.add(batchLabel);
    }
  }

  return { candidates, batches: [...batches], skipped };
}

function emptyToNull(v: string): string | null {
  return v.trim() === "" ? null : v.trim();
}
