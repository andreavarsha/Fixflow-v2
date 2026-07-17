import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { IconClipboard, IconStar } from "../icons";
import { NotificationFeed } from "../layout/NotificationFeed";
import {
  IncomingQuoteCard,
  type IncomingQuoteRequest,
} from "./IncomingQuoteCard";
import { ffCard, ffScreenTitle } from "../../lib/fixflowUi";
import { supplierUi } from "../../lib/supplierDashboardUi";
import { useLanguage } from "../../lib/LanguageContext";

type FilterId = "all" | "action" | "submitted" | "active" | "closed";

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
  const [filter, setFilter] = useState<FilterId>("action");
  const [openChatJobId, setOpenChatJobId] = useState<Id<"jobs"> | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<Id<"jobs"> | null>(null);
  const me = useQuery(api.users.getUser);
  const quoteRequests = useQuery(api.quoteRequests.listForSupplier);
  const { language } = useLanguage();

  const t = useMemo(() => supplierUi(language), [language]);

  const counts = useMemo(() => {
    const list = quoteRequests ?? [];
    return {
      action: list.filter((r) => matchesFilter(r, "action")).length,
      submitted: list.filter((r) => matchesFilter(r, "submitted")).length,
      active: list.filter((r) => matchesFilter(r, "active")).length,
      closed: list.filter((r) => matchesFilter(r, "closed")).length,
    };
  }, [quoteRequests]);

  // One chip row = filter + live count (no "All" tab). "Done" omits its count.
  const chips = useMemo(
    () => [
      { id: "action" as FilterId, label: t.filterAction, count: counts.action },
      { id: "submitted" as FilterId, label: t.filterSubmitted, count: counts.submitted },
      { id: "active" as FilterId, label: t.filterActive, count: counts.active },
      { id: "closed" as FilterId, label: t.filterClosed, count: undefined },
    ],
    [t, counts],
  );

  useEffect(() => {
    if (!openChatJobId) return;
    setExpandedJobId(openChatJobId);
    const el = document.getElementById(`supplier-job-${openChatJobId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [openChatJobId]);

  const filtered = useMemo(() => {
    if (!quoteRequests) return [];
    return quoteRequests.filter((r) => matchesFilter(r, filter));
  }, [quoteRequests, filter]);

  const total = quoteRequests?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Identity-only header (explainer removed per wireframe) */}
      <header className="mb-5 flex items-center justify-between gap-3 pr-12 sm:pr-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t.roleLabel}
          </p>
          <h1 className={ffScreenTitle}>{t.dashboardTitle}</h1>
        </div>
        {me && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {me.reviewCount ? (
              <>
                <IconStar size={14} filled className="text-amber-500" />{" "}
                {(me.rating ?? 0).toFixed(1)}
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

      {/* Chip row = filters + at-a-glance counts merged */}
      {total > 0 && (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter requests"
        >
          {chips.map(({ id, label, count }) => {
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
                    ? "flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground shadow-sm"
                    : "flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-accent"
                }
              >
                {label}
                {count !== undefined && (
                  <span
                    className={
                      selected
                        ? "font-bold text-primary-foreground"
                        : "font-bold text-foreground"
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
        <section className="min-w-0 lg:col-span-8 xl:col-span-8">
          <div className={`${ffCard} overflow-hidden p-0`}>
            <div className="px-1 py-1 sm:px-2 sm:py-2">
              {quoteRequests === undefined && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {t.loading}
                </p>
              )}

              {quoteRequests !== undefined && total === 0 && (
                <div className="px-5 py-12 text-center sm:px-8">
                  <IconClipboard
                    size={36}
                    className="mx-auto text-muted-foreground"
                  />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {t.emptyTitle}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t.emptyBody}
                  </p>
                </div>
              )}

              {quoteRequests !== undefined &&
                total > 0 &&
                filtered.length === 0 && (
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
                      expanded={expandedJobId === request.jobId}
                      onExpandedChange={(open) =>
                        setExpandedJobId(open ? request.jobId : null)
                      }
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
