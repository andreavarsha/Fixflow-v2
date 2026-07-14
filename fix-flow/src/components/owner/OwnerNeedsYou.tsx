import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  formatOwnerJobMeta,
  isNeedsYouJob,
  needsYouPriority,
  ownerJobTitle,
} from "../../lib/ownerJobMeta";
import { ffBtnGhost, ffBtnSecondary, ffCard, ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";

type OwnerNeedsYouProps = {
  onCompareQuotes: (jobId: Id<"jobs">) => void;
  onConfirmPayment: (jobId: Id<"jobs">) => void;
  onGoActivity: () => void;
  onGoReport: () => void;
};

export function OwnerNeedsYou({
  onCompareQuotes,
  onConfirmPayment,
  onGoActivity,
  onGoReport,
}: OwnerNeedsYouProps) {
  const jobs = useQuery(api.jobs.listMyJobs);

  if (jobs === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const actionable = jobs
    .filter((j) => isNeedsYouJob(j.workflowStatus))
    .sort(
      (a, b) =>
        needsYouPriority(a.workflowStatus) - needsYouPriority(b.workflowStatus),
    );

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
      <header className="mb-6 pr-12 sm:pr-14">
        <h1 className={ffScreenTitle}>Needs your input</h1>
        <p className={ffScreenSubtitle}>
          {actionable.length === 0
            ? "You're all caught up"
            : `${actionable.length} thing${actionable.length === 1 ? "" : "s"} waiting on you`}
        </p>
      </header>

      {actionable.length === 0 ? (
        <div className={`${ffCard} text-center`}>
          <p className="text-2xl" aria-hidden>
            ✓
          </p>
          <p className="mt-3 font-medium text-foreground">You&apos;re all caught up</p>
          <p className="mt-2 text-sm text-muted-foreground">
            New quotes and payment requests will show up here.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={onGoReport} className={ffBtnSecondary}>
              Report an issue
            </button>
            <button type="button" onClick={onGoActivity} className={ffBtnGhost}>
              View activity →
            </button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {actionable.map((job) => {
            const isPay = job.workflowStatus === "pay_supplier";
            return (
              <li
                key={job._id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-primary/15"
              >
                <span className="inline-flex rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  {isPay ? "Payment due" : "Quotes ready"}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  {ownerJobTitle(job)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isPay
                    ? formatOwnerJobMeta({ ...job, quotedCount: 0 })
                    : formatOwnerJobMeta(job)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    isPay
                      ? onConfirmPayment(job._id)
                      : onCompareQuotes(job._id)
                  }
                  className={`${ffBtnSecondary} mt-5 border-foreground`}
                >
                  {isPay ? "Confirm payment" : "Compare & accept"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {actionable.length > 0 && (
        <button
          type="button"
          onClick={onGoActivity}
          className={`${ffBtnGhost} mt-6 text-sm`}
        >
          Everything else lives in Activity →
        </button>
      )}
    </div>
  );
}
