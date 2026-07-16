import { zoneByIdName } from "./zones";

export type OwnerListJob = {
  workflowStatus: string;
  category?: string;
  zoneId?: string;
  quotedCount?: number;
  nearestDistanceKm?: number;
  aiSummary?: string;
  description: string;
};

/** Meta line for Needs You / Activity cards. */
export function formatOwnerJobMeta(job: OwnerListJob): string {
  const parts: string[] = [];
  const quoted = job.quotedCount ?? 0;
  if (quoted > 0) {
    parts.push(`${quoted} quote${quoted === 1 ? "" : "s"}`);
  }
  const zone = zoneByIdName(job.zoneId);
  if (zone) parts.push(zone);
  if (job.nearestDistanceKm !== undefined) {
    parts.push(`from ${job.nearestDistanceKm.toFixed(1)} km`);
  }
  if (job.category) parts.push(job.category);
  return parts.join(" · ");
}

export function ownerJobTitle(job: Pick<OwnerListJob, "aiSummary" | "description">): string {
  return job.aiSummary?.trim() || job.description.trim() || "Repair request";
}

export function needsYouPriority(workflowStatus: string): number {
  if (workflowStatus === "pay_supplier") return 0;
  if (workflowStatus === "select_supplier") return 1;
  return 99;
}

export function isNeedsYouJob(workflowStatus: string): boolean {
  return (
    workflowStatus === "pay_supplier" || workflowStatus === "select_supplier"
  );
}
