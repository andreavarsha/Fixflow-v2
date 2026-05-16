/** Fixed trade categories (PRD §7) — shared by classification and owner edits. */
export const JOB_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Roofing",
  "Carpentry",
  "Painting",
  "Garden / Landscaping",
  "General Maintenance",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_URGENCIES = ["High", "Medium", "Low"] as const;
export type JobUrgency = (typeof JOB_URGENCIES)[number];

const LEGACY_STRUCTURAL_CATEGORY = "Structural / Masonry";

/** Map stored job/supplier category to the current discovery filter. */
export function resolveDiscoveryCategory(category: string): string {
  if (category === LEGACY_STRUCTURAL_CATEGORY) return "Roofing";
  return category;
}

export function normalizeCategory(raw: string | undefined): JobCategory {
  if (!raw) return "General Maintenance";
  const trimmed = raw.trim();
  if (trimmed === LEGACY_STRUCTURAL_CATEGORY) return "Roofing";

  const exact = JOB_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  if (lower.includes("plumb") || lower.includes("leak") || lower.includes("pipe")) {
    return "Plumbing";
  }
  if (lower.includes("electric") || lower.includes("wiring")) return "Electrical";
  if (
    lower.includes("roof") ||
    lower.includes("ceiling") ||
    lower.includes("struct") ||
    lower.includes("mason") ||
    lower.includes("wall crack")
  ) {
    return "Roofing";
  }
  if (lower.includes("carpent") || lower.includes("wood")) return "Carpentry";
  if (lower.includes("paint")) return "Painting";
  if (lower.includes("garden") || lower.includes("lawn") || lower.includes("landscape")) {
    return "Garden / Landscaping";
  }

  return "General Maintenance";
}
