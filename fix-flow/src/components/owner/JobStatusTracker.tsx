import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type JobStatusTrackerProps = {
  jobId: Id<"jobs">;
};

export function JobStatusTracker({ jobId }: JobStatusTrackerProps) {
  const timeline = useQuery(api.jobs.getTimeline, { jobId });

  if (!timeline) return null;

  return (
    <nav className="mb-6 overflow-x-auto" aria-label="Job status">
      <ol className="flex min-w-max items-center gap-1 sm:gap-2">
        {timeline.map((step, i) => {
          const done = step.state === "done";
          const active = step.state === "current";
          return (
            <li key={step.step} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && (
                <span
                  className={`h-px w-3 sm:w-5 ${done || active ? "bg-primary" : "bg-border"}`}
                  aria-hidden
                />
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                      : "bg-muted text-muted-foreground/70"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {step.step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
