import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "../../lib/LanguageContext";
import {
  formatOwnerJobMeta,
  isNeedsYouJob,
  ownerJobTitle,
} from "../../lib/ownerJobMeta";
import { NotificationFeed } from "../layout/NotificationFeed";
import { ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";

type OwnerActivityProps = {
  onOpenJob: (jobId: Id<"jobs">) => void;
  onOpenQuotes?: (jobId: Id<"jobs">) => void;
};

type ActivityFilter = "all" | "in_progress" | "complete";

export function OwnerActivity({ onOpenJob, onOpenQuotes }: OwnerActivityProps) {
  const jobs = useQuery(api.jobs.listMyJobs);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    if (!jobs) return [];
    if (filter === "complete") {
      return jobs.filter((j) => j.workflowStatus === "completed");
    }
    if (filter === "in_progress") {
      return jobs.filter(
        (j) =>
          j.workflowStatus === "work_in_progress" ||
          j.workflowStatus === "pay_supplier" ||
          j.workflowStatus === "pending_quotes" ||
          j.workflowStatus === "select_supplier" ||
          j.workflowStatus === "find_suppliers" ||
          j.workflowStatus === "classifying",
      );
    }
    return jobs;
  }, [jobs, filter]);

  const filters = useMemo(() => [
    { id: "all" as ActivityFilter, label: t("filterAll") },
    { id: "in_progress" as ActivityFilter, label: t("filterInProgress") },
    { id: "complete" as ActivityFilter, label: t("filterComplete") },
  ], [t]);

  if (jobs === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
      <header className="mb-4 pr-12 sm:pr-14">
        <h1 className={ffScreenTitle}>{t("activityTitle")}</h1>
        <p className={ffScreenSubtitle}>{t("activitySubtitle")}</p>
      </header>

      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Activity filter"
      >
        {filters.map(({ id, label }) => {
          const selected = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(id)}
              className={
                selected
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
                  : "rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-accent"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <p className="font-medium text-foreground">{t("activityNoRequests")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("activityReportTip")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("activityNoJobsMatch")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((job) => {
            const needsYou = isNeedsYouJob(job.workflowStatus);
            const completed = job.workflowStatus === "completed";
            const inProgress =
              job.workflowStatus === "work_in_progress" ||
              job.workflowStatus === "pay_supplier";
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
                : inProgress
                  ? "bg-amber-400"
                  : "bg-amber-400";

            const border = needsYou
              ? "border-primary/30 ring-1 ring-primary/10"
              : justSubmitted
                ? "border-amber-200 dark:border-amber-900/50"
                : "border-border";

            const meta = activityMeta(job, t);

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
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {(justSubmitted || quotesIn || inProgress || completed) && (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            completed
                              ? "bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300"
                              : inProgress
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                                : quotesIn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {completed
                            ? t("activityCompleted")
                            : inProgress
                              ? job.workflowStatus === "pay_supplier"
                                ? t("activityAwaitingPayment")
                                : t("activityInProgress")
                              : quotesIn
                                ? `${job.quotedCount} ${t("activityQuotesInCount")}`
                                : job.workflowStatus === "pending_quotes"
                                  ? t("activityFindingPros")
                                  : t("activityJustSubmitted")}
                        </span>
                      )}
                    </div>
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

      <div className="mt-8">
        <NotificationFeed
          title={t("activityUpdates")}
          hint={t("activityUpdatesHint")}
          emptyLabel={t("activityUpdatesEmpty")}
          onOpenJobChat={(jobId) => onOpenJob(jobId)}
        />
      </div>
    </div>
  );
}

function activityMeta(
  job: {
    workflowStatus: string;
    zoneId?: string;
    quotedCount?: number;
    nearestDistanceKm?: number;
    category?: string;
    _creationTime: number;
    description: string;
    aiSummary?: string;
  },
  t: any,
): string {
  const statusLine = workflowStatusLine(job.workflowStatus, t);
  const detail = formatOwnerJobMeta(job);
  const when = formatRelative(job._creationTime);
  if (job.workflowStatus === "select_supplier") {
    return detail ? `${t("activityQuotesReady")} · ${detail}` : t("activityQuotesReady");
  }
  if (job.workflowStatus === "pending_quotes" || job.workflowStatus === "find_suppliers") {
    return [statusLine, detail].filter(Boolean).join(" · ");
  }
  return [statusLine, when, detail].filter(Boolean).join(" · ");
}

function workflowStatusLine(status: string, t: any): string {
  switch (status) {
    case "classifying":
      return t("activityAnalyzing");
    case "find_suppliers":
      return t("activityFindingPros");
    case "pending_quotes":
      return t("activityAwaitingQuotes");
    case "select_supplier":
      return t("activityQuotesReady");
    case "work_in_progress":
      return t("activityInProgress");
    case "pay_supplier":
      return t("activityAwaitingPayment");
    case "completed":
      return t("activityCompleted");
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
