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
  classifying: "bg-gray-100 text-gray-700",
  find_suppliers: "bg-slate-100 text-slate-800",
  pending_quotes: "bg-amber-100 text-amber-900",
  select_supplier: "bg-blue-100 text-blue-900",
  work_in_progress: "bg-blue-100 text-blue-900",
  pay_supplier: "bg-violet-100 text-violet-900",
  completed: "bg-emerald-100 text-emerald-900",
};

const WORKFLOW_ACCENT: Record<WorkflowStatus, string> = {
  classifying: "border-l-gray-400",
  find_suppliers: "border-l-slate-400",
  pending_quotes: "border-l-amber-500",
  select_supplier: "border-l-blue-500",
  work_in_progress: "border-l-blue-500",
  pay_supplier: "border-l-violet-500",
  completed: "border-l-emerald-500",
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
        <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
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
          <p className="text-sm font-medium text-gray-900">No requests yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Your repair history will show up here after you submit one.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500 sm:px-6">
          Only viewing the current request.
        </p>
      ) : (
        <ul
          className={
            isSidebar
              ? "max-h-[min(32rem,calc(100dvh-12rem))] divide-y divide-gray-100 overflow-y-auto"
              : "divide-y divide-gray-100"
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
                  className={`group flex w-full gap-3 border-l-4 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5 ${WORKFLOW_ACCENT[workflow]}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${WORKFLOW_STYLE[workflow]}`}
                      >
                        {WORKFLOW_LABEL[workflow]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-gray-900 group-hover:text-gray-950">
                      {preview}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {[job.category, job.urgency ? `${job.urgency} urgency` : null]
                        .filter(Boolean)
                        .join(" · ")}
                      {job.category || job.urgency ? " · " : ""}
                      {formatSubmitted(job._creationTime)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 self-center text-lg text-gray-300 transition group-hover:text-gray-500"
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
            ? "border-b border-gray-100 bg-gray-50/90 px-5 py-4 sm:px-6"
            : "mb-4"
        }
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2
            className={
              isSidebar
                ? "text-base font-semibold text-gray-900"
                : "text-sm font-semibold uppercase tracking-wide text-gray-400"
            }
          >
            Your requests
          </h2>
          {count > 0 && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {count}
            </span>
          )}
        </div>
        <p className={`mt-1 text-sm text-gray-500 ${isSidebar ? "" : "max-w-xl"}`}>
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
