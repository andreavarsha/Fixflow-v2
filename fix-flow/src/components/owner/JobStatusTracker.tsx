import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const STEPS = [
  { id: "submitted", label: "Request submitted" },
  { id: "finding", label: "Finding pros" },
  { id: "quotes", label: "Quotes received" },
  { id: "accepted", label: "Accepted" },
  { id: "in_progress", label: "Work in progress" },
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "completed", label: "Complete" },
] as const;

function activeStepIndex(
  status: string | undefined,
  hasQuotes: boolean,
  hasQuoted: boolean,
  hasAccepted: boolean,
): number {
  if (status === "completed") return 6;
  if (status === "awaiting_payment") return 5;
  if (status === "in_progress") return 4;
  if (status === "classifying") return 0;
  if (status === "open") {
    if (hasAccepted) return 3;
    if (hasQuoted || hasQuotes) return 2;
    return 1;
  }
  return 0;
}

type JobStatusTrackerProps = {
  jobId: Id<"jobs">;
  status?: string;
};

export function JobStatusTracker({ jobId, status }: JobStatusTrackerProps) {
  const quotes = useQuery(api.quoteRequests.getLiveQuotes, { jobId });
  const hasQuotes = (quotes?.length ?? 0) > 0;
  const hasQuoted =
    quotes?.some((q) => q.status === "quoted" || q.status === "accepted") ??
    false;
  const hasAccepted =
    quotes?.some((q) => q.status === "accepted") ?? false;

  const index = activeStepIndex(status, hasQuotes, hasQuoted, hasAccepted);

  return (
    <nav className="mb-6 overflow-x-auto" aria-label="Job status">
      <ol className="flex min-w-max items-center gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && (
                <span
                  className={`h-px w-3 sm:w-5 ${done || active ? "bg-gray-900" : "bg-gray-200"}`}
                  aria-hidden
                />
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs ${
                  active
                    ? "bg-gray-900 text-white"
                    : done
                      ? "bg-gray-200 text-gray-800"
                      : "bg-gray-100 text-gray-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
