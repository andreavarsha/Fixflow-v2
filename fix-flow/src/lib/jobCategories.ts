/** Mirror of convex/jobCategories.ts for owner UI dropdowns. */
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
