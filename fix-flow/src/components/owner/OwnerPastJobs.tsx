import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ffCard } from "../../lib/fixflowUi";

type WorkflowStatus =
  | "classifying"
  | "find_suppliers"
  | "pending_quotes"
  | "select_supplier"
  | "work_in_progress"
  | "pay_supplier"
  | "completed";

const WORKFLOW_LABEL: Record<WorkflowStatus, string> = {
  classifying: "Classifying",
  find_suppliers: "Find suppliers",
  pending_quotes: "Pending quotes",
  select_supplier: "Select supplier",
  work_in_progress: "Work in progress",
  pay_supplier: "Pay supplier",
  completed: "Completed",
};

const WORKFLOW_STYLE: Record<WorkflowStatus, string> = {
  classifying: "bg-muted text-muted-foreground",
  find_suppliers: "bg-secondary text-secondary-foreground",
  pending_quotes: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  select_supplier: "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300",
  work_in_progress: "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300",
  pay_supplier: "bg-primary/15 text-primary dark:bg-primary/20",
  completed: "bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
};

const WORKFLOW_ACCENT: Record<WorkflowStatus, string> = {
  classifying: "border-l-muted-foreground/40",
  find_suppliers: "border-l-muted-foreground/40",
  pending_quotes: "border-l-amber-500",
  select_supplier: "border-l-blue-500",
  work_in_progress: "border-l-blue-500",
  pay_supplier: "border-l-primary",
  completed: "border-l-teal-500",
};

type OwnerPastJobsProps = {
  onOpenJob: (jobId: Id<"jobs">) => void;
  currentJobId?: Id<"jobs"> | null;
  /** Sidebar on home dashboard; stacked list below form on small screens. */
  variant?: "sidebar" | "stacked";
};

export function OwnerPastJobs({
  onOpenJob,
  currentJobId,
  variant = "stacked",
}: OwnerPastJobsProps) {
  const jobs = useQuery(api.jobs.listMyJobs);

  if (jobs === undefined) {
    return (
      <Panel variant={variant} count={0}>
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
      </Panel>
    );
  }

  const visible = currentJobId
    ? jobs.filter((j) => j._id !== currentJobId)
    : jobs;

  const isSidebar = variant === "sidebar";

  return (
    <Panel variant={variant} count={jobs.length}>
      {jobs.length === 0 ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-foreground">No requests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your repair history will show up here after you submit one.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground sm:px-6">
          Only viewing the current request.
        </p>
      ) : (
        <ul
          className={
            isSidebar
              ? "max-h-[min(32rem,calc(100dvh-12rem))] divide-y divide-border overflow-y-auto"
              : "divide-y divide-border"
          }
        >
          {visible.map((job) => {
            const preview =
              job.aiSummary?.trim() ||
              job.description.trim() ||
              "Repair request";
            const workflow = (job.workflowStatus ?? "find_suppliers") as WorkflowStatus;

            return (
              <li key={job._id}>
                <button
                  type="button"
                  onClick={() => onOpenJob(job._id)}
                  className={`group flex w-full gap-3 border-l-4 px-4 py-4 text-left transition hover:bg-accent sm:px-5 ${WORKFLOW_ACCENT[workflow]}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${WORKFLOW_STYLE[workflow]}`}
                      >
                        {WORKFLOW_LABEL[workflow]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-foreground">
                      {preview}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[job.category, job.urgency ? `${job.urgency} urgency` : null]
                        .filter(Boolean)
                        .join(" · ")}
                      {job.category || job.urgency ? " · " : ""}
                      {formatSubmitted(job._creationTime)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 self-center text-lg text-muted-foreground/50 transition group-hover:text-muted-foreground"
                    aria-hidden
                  >
                    →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Panel({
  variant,
  count,
  children,
}: {
  variant: "sidebar" | "stacked";
  count: number;
  children: React.ReactNode;
}) {
  const isSidebar = variant === "sidebar";

  return (
    <section
      className={
        isSidebar
          ? `${ffCard} sticky top-6 overflow-hidden p-0`
          : "mt-10"
      }
    >
      <header
        className={
          isSidebar
            ? "border-b border-border bg-muted/50 px-5 py-4 sm:px-6"
            : "mb-4"
        }
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2
            className={
              isSidebar
                ? "text-base font-semibold text-foreground"
                : "text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            }
          >
            Your requests
          </h2>
          {count > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              {count}
            </span>
          )}
        </div>
        <p className={`mt-1 text-sm text-muted-foreground ${isSidebar ? "" : "max-w-xl"}`}>
          Tap to continue where you left off — quotes update live.
        </p>
      </header>
      {isSidebar ? children : <div className="mt-4">{children}</div>}
    </section>
  );
}

function formatSubmitted(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
