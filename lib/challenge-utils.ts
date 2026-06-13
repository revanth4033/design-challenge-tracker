// Normalizes the inconsistent challenge names found in the Excel sheet
// ("Hotel POS", "Hotel Raw mgmt", "Hotel Raw Management") into canonical types.

export interface CanonicalChallenge {
  name: string;
  slug: string;
  description: string;
}

export const CANONICAL_CHALLENGES: CanonicalChallenge[] = [
  {
    name: "Hotel POS",
    slug: "hotel-pos",
    description: "Point-of-sale interface for hotel food & beverage ordering.",
  },
  {
    name: "Hotel Raw Management",
    slug: "hotel-raw-management",
    description: "Raw material / inventory management dashboard for hotels.",
  },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map a raw Excel challenge string to a canonical challenge name.
 * Returns null when the cell is empty / unrecognized.
 */
export function normalizeChallengeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!v) return null;
  if (v.includes("pos")) return "Hotel POS";
  if (v.includes("raw")) return "Hotel Raw Management";
  // Unknown but non-empty challenge — keep a cleaned-up version of the label.
  return raw.trim();
}
