import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotificationFeed } from "../layout/NotificationFeed";
import {
  IncomingQuoteCard,
  type IncomingQuoteRequest,
} from "./IncomingQuoteCard";
import { ffCard, ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";
import { supplierUi } from "../../lib/supplierDashboardUi";

const t = supplierUi("en");

type FilterId = "all" | "action" | "submitted" | "active" | "closed";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: t.filterAll },
  { id: "action", label: t.filterAction },
  { id: "submitted", label: t.filterSubmitted },
  { id: "active", label: t.filterActive },
  { id: "closed", label: t.filterClosed },
];

function matchesFilter(request: IncomingQuoteRequest, filter: FilterId): boolean {
  if (filter === "all") return true;
  if (filter === "action") return request.status === "pending";
  if (filter === "submitted") return request.status === "quoted";
  if (filter === "active") {
    return (
      request.status === "accepted" &&
      (request.jobStatus === "in_progress" ||
        request.jobStatus === "awaiting_payment")
    );
  }
  return (
    request.status === "rejected" ||
    (request.status === "accepted" && request.jobStatus === "completed")
  );
}

export function SupplierHomeDashboard() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [openChatJobId, setOpenChatJobId] = useState<Id<"jobs"> | null>(null);
  const me = useQuery(api.users.getUser);
  const quoteRequests = useQuery(api.quoteRequests.listForSupplier);

  useEffect(() => {
    if (!openChatJobId) return;
    const el = document.getElementById(`supplier-job-${openChatJobId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [openChatJobId]);

  const stats = useMemo(() => {
    const list = quoteRequests ?? [];
    return {
      pending: list.filter((r) => r.status === "pending").length,
      quoted: list.filter((r) => r.status === "quoted").length,
      accepted: list.filter((r) => r.status === "accepted").length,
      rejected: list.filter((r) => r.status === "rejected").length,
    };
  }, [quoteRequests]);

  const filtered = useMemo(() => {
    if (!quoteRequests) return [];
    return quoteRequests.filter((r) => matchesFilter(r, filter));
  }, [quoteRequests, filter]);

  const total = quoteRequests?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-3 pr-12 sm:pr-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.roleLabel}
          </p>
          <h1 className={ffScreenTitle}>{t.dashboardTitle}</h1>
          <p className={ffScreenSubtitle}>{t.dashboardSubtitle}</p>
        </div>
        {me && (
          <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {me.reviewCount ? (
              <>
                <span className="text-amber-500">★</span> {(me.rating ?? 0).toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({me.reviewCount})
                </span>
              </>
            ) : (
              <span className="uppercase tracking-wide">New</span>
            )}
          </span>
        )}
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
        <section className="min-w-0 lg:col-span-8 xl:col-span-8">
          <div className={`${ffCard} overflow-hidden p-0`}>
            <div className="border-b border-border bg-gradient-to-br from-muted/50 to-card px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  {t.incomingRequests}
                </h2>
                {total > 0 && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {total}
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t.incomingHint}</p>

              {total > 0 && (
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Filter requests"
                >
                  {FILTERS.map(({ id, label }) => {
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
              )}
            </div>

            <div className="px-1 py-1 sm:px-2 sm:py-2">
              {quoteRequests === undefined && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {t.loading}
                </p>
              )}

              {quoteRequests !== undefined && total === 0 && (
                <div className="px-5 py-12 text-center sm:px-8">
                  <p className="text-3xl" aria-hidden>
                    📋
                  </p>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {t.emptyTitle}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t.emptyBody}
                  </p>
                </div>
              )}

              {quoteRequests !== undefined && total > 0 && filtered.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
                  {t.emptyFiltered}
                </p>
              )}

              {filtered.length > 0 && (
                <ul className="divide-y divide-border">
                  {filtered.map((request) => (
                    <IncomingQuoteCard
                      key={request._id}
                      request={request}
                      chatOpen={openChatJobId === request.jobId}
                      onChatOpenChange={(open) =>
                        setOpenChatJobId(open ? request.jobId : null)
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-4 xl:col-span-4">
          <section className={`${ffCard} overflow-hidden p-0`}>
            <header className="border-b border-border bg-muted/50 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-foreground">At a glance</h2>
            </header>
            <ul className="divide-y divide-border">
              <StatRow label={t.statAwaiting} value={stats.pending} accent="amber" />
              <StatRow label={t.statSubmitted} value={stats.quoted} accent="brand" />
              <StatRow label={t.statWon} value={stats.accepted} accent="green" />
              <StatRow label={t.statLost} value={stats.rejected} accent="gray" />
            </ul>
          </section>

          <NotificationFeed
            title={t.notificationsTitle}
            hint={t.notificationsHintOpenChat}
            emptyLabel={t.notificationsEmpty}
            onOpenJobChat={(jobId) => {
              setFilter("all");
              setOpenChatJobId(jobId);
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "brand" | "green" | "gray";
}) {
  const dot =
    accent === "amber"
      ? "bg-amber-500"
      : accent === "brand"
        ? "bg-primary"
        : accent === "green"
          ? "bg-[#4CAF50]"
          : "bg-muted-foreground/40";

  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
      <span className="flex items-center gap-2.5 text-sm text-foreground/80">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
    </li>
  );
}
