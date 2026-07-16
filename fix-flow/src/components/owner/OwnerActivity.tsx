import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  formatOwnerJobMeta,
  isNeedsYouJob,
  ownerJobTitle,
} from "../../lib/ownerJobMeta";
import { ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";

type OwnerActivityProps = {
  onOpenJob: (jobId: Id<"jobs">) => void;
  onOpenQuotes?: (jobId: Id<"jobs">) => void;
};

export function OwnerActivity({ onOpenJob, onOpenQuotes }: OwnerActivityProps) {
  const jobs = useQuery(api.jobs.listMyJobs);

  if (jobs === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
      <header className="mb-6 pr-12 sm:pr-14">
        <h1 className={ffScreenTitle}>Activity</h1>
        <p className={ffScreenSubtitle}>All your requests</p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <p className="font-medium text-foreground">No requests yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap + to report your first repair.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => {
            const needsYou = isNeedsYouJob(job.workflowStatus);
            const completed = job.workflowStatus === "completed";
            const justSubmitted =
              job.workflowStatus === "find_suppliers" ||
              job.workflowStatus === "classifying" ||
              job.workflowStatus === "pending_quotes";
            const quotesIn =
              job.workflowStatus === "select_supplier" &&
              (job.quotedCount ?? 0) > 0;

            const dot = needsYou
              ? "bg-primary"
              : completed
                ? "bg-teal-500"
                : "bg-amber-400";

            const border = needsYou
              ? "border-primary/30 ring-1 ring-primary/10"
              : justSubmitted
                ? "border-amber-200 dark:border-amber-900/50"
                : "border-border";

            const meta = activityMeta(job);

            return (
              <li key={job._id}>
                <button
                  type="button"
                  onClick={() => {
                    if (quotesIn && onOpenQuotes) onOpenQuotes(job._id);
                    else onOpenJob(job._id);
                  }}
                  className={`flex w-full gap-3 rounded-2xl border bg-card px-4 py-4 text-left shadow-sm transition hover:bg-accent ${border}`}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    {(justSubmitted || quotesIn) && (
                      <span
                        className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          quotesIn
                            ? "bg-primary text-primary-foreground"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {quotesIn
                          ? `${job.quotedCount} quotes in`
                          : job.workflowStatus === "pending_quotes"
                            ? "Finding pros"
                            : "Just submitted"}
                      </span>
                    )}
                    <p className="font-semibold text-foreground">
                      {ownerJobTitle(job)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function activityMeta(job: {
  workflowStatus: string;
  zoneId?: string;
  quotedCount?: number;
  nearestDistanceKm?: number;
  category?: string;
  _creationTime: number;
  description: string;
  aiSummary?: string;
}): string {
  const statusLine = workflowStatusLine(job.workflowStatus);
  const detail = formatOwnerJobMeta(job);
  const when = formatRelative(job._creationTime);
  if (job.workflowStatus === "select_supplier") {
    return detail ? `Compare & accept → · ${detail}` : "Compare & accept →";
  }
  if (job.workflowStatus === "pending_quotes" || job.workflowStatus === "find_suppliers") {
    return [statusLine, detail].filter(Boolean).join(" · ");
  }
  return [statusLine, when, detail].filter(Boolean).join(" · ");
}

function workflowStatusLine(status: string): string {
  switch (status) {
    case "classifying":
      return "Analyzing";
    case "find_suppliers":
      return "Finding pros";
    case "pending_quotes":
      return "Awaiting quotes";
    case "select_supplier":
      return "Quotes ready";
    case "work_in_progress":
      return "In progress";
    case "pay_supplier":
      return "Awaiting payment";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function formatRelative(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
