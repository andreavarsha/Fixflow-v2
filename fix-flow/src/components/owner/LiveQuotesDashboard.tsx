import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { OwnerStepHint } from "../layout/OwnerStepHint";
import { ChatPanel } from "../messaging/ChatPanel";
import { IconStar } from "../icons";
import { SupplierDiscoveryMap } from "./SupplierDiscoveryMap";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffCard,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { formatResponseMinutes } from "../../lib/supplierDashboardUi";
import { initials } from "../../lib/initials";
import { toUserFacingError } from "../../lib/userFacingError";
import { useLanguage } from "../../lib/LanguageContext";

type LiveQuotesDashboardProps = {
  jobId: Id<"jobs">;
  onBack: () => void;
  onGoToSuppliers: () => void;
  onStepClick?: (step: 1 | 2 | 3) => void;
  canGoToStep?: (step: 1 | 2 | 3) => boolean;
};

type QuoteRow = {
  _id: Id<"quoteRequests">;
  supplierId: Id<"users">;
  status: string;
  priceLKR?: number;
  duration?: string;
  notes?: string;
  isFinal?: boolean;
  supplierName?: string;
  supplierRating?: number;
  supplierReviewCount?: number;
  distanceKm?: number;
  avgResponseMinutes?: number;
  completedJobs?: number;
};

export function LiveQuotesDashboard({
  jobId,
  onBack,
  onGoToSuppliers,
  onStepClick,
  canGoToStep,
}: LiveQuotesDashboardProps) {
  const quotes = useQuery(api.quoteRequests.getLiveQuotes, { jobId });
  const job = useQuery(api.jobs.getJob, { jobId });
  const nearby = useQuery(api.suppliers.getSuppliersNearJob, { jobId });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const acceptQuote = useMutation(api.quoteRequests.acceptQuote);
  const [acceptingId, setAcceptingId] = useState<Id<"quoteRequests"> | null>(
    null,
  );
  const [acceptError, setAcceptError] = useState("");
  const [chatOpenFor, setChatOpenFor] = useState<Id<"users"> | null>(null);
  const { t } = useLanguage();

  const jobOpen = job?.status === "open";
  const canPickMoreSuppliers = jobOpen && Boolean(job?.category);

  async function handleAccept(quoteRequestId: Id<"quoteRequests">) {
    setAcceptError("");
    setAcceptingId(quoteRequestId);
    try {
      await acceptQuote({ jobId, quoteRequestId });
    } catch (err: unknown) {
      setAcceptError(toUserFacingError(err));
    } finally {
      setAcceptingId(null);
    }
  }

  const mapSuppliers = (nearby ?? []).filter((s) =>
    (quotes ?? []).some((q) => q.supplierId === s._id),
  );

  const chatPeer = (quotes ?? []).find((q) => q.supplierId === chatOpenFor);

  const quotedOffers = (quotes ?? []).filter(
    (q) => (q.status === "quoted" || q.status === "accepted") && q.priceLKR !== undefined,
  );
  const bestPriceId =
    quotedOffers.length > 1
      ? quotedOffers.reduce((min, q) =>
          (q.priceLKR ?? Infinity) < (min.priceLKR ?? Infinity) ? q : min,
        )._id
      : undefined;

  /** Localize job status badge */
  function getJobStatusText(status: string) {
    if (status === "in_progress") return t("jobStatusInProgress");
    if (status === "awaiting_payment") return t("jobStatusAwaitingPayment");
    if (status === "completed") return t("jobStatusClosed");
    return status;
  }

  return (
    <div>
      <OwnerStepHint
        active={3}
        onStepClick={onStepClick}
        canGoToStep={canGoToStep}
      />

      <div className="-mt-1 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={onBack} className={`${ffBtnGhost} text-left`}>
          {t("jobDetails")}
        </button>
        {canPickMoreSuppliers && (
          <button
            type="button"
            onClick={onGoToSuppliers}
            className={`${ffBtnGhost} text-left`}
          >
            {t("chooseSuppliersFwd")}
          </button>
        )}
      </div>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0 flex-1">
          <h1 className={ffScreenTitle}>{t("quoteInboxTitle")}</h1>
          <p className={ffScreenSubtitle}>
            {t("quoteInboxSubtitle")}
          </p>
        </div>
        <div
          className="relative shrink-0 rounded-full bg-card p-2 shadow-sm ring-1 ring-border"
          title={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <span className="text-xl leading-none" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </header>

      {job?.lat !== undefined && job.lng !== undefined && mapSuppliers.length > 0 && (
        <div className="mb-6">
          <SupplierDiscoveryMap
            jobLat={job.lat}
            jobLng={job.lng}
            suppliers={mapSuppliers}
            selected={[]}
            onToggle={() => undefined}
            heightClassName="h-48 sm:h-56"
            compact
          />
        </div>
      )}

      {quotes === undefined && (
        <p className="text-sm text-muted-foreground">{t("loadingQuotes")}</p>
      )}

      {quotes !== undefined && quotes.length === 0 && (
        <div className={`${ffCard} flex flex-col gap-4 text-sm text-muted-foreground`}>
          <div>
            <p className="font-medium text-foreground">{t("noRequestsSentTitle")}</p>
            <p className="mt-2 leading-relaxed">
              {t("noRequestsSentDesc")}
            </p>
          </div>
          {canPickMoreSuppliers && (
            <button
              type="button"
              onClick={onGoToSuppliers}
              className={`${ffBtnPrimary} self-start`}
            >
              {t("chooseSuppliers")}
            </button>
          )}
        </div>
      )}

      {acceptError && (
        <p
          className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {acceptError}
        </p>
      )}

      {job && !jobOpen && (
        <div className={`${ffCard} mb-4 text-sm text-foreground/80`}>
          <p>
            <span className="font-medium text-foreground">{t("jobStatusLabel")}</span>{" "}
            {getJobStatusText(job.status)}
          </p>
        </div>
      )}

      {quotes !== undefined && quotes.length > 0 && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((q) => (
              <QuoteCompareCard
                key={q._id}
                jobId={jobId}
                quote={q}
                jobOpen={jobOpen}
                isBestPrice={q._id === bestPriceId}
                chatOpen={chatOpenFor === q.supplierId}
                acceptingId={acceptingId}
                onAccept={() => void handleAccept(q._id)}
                onToggleChat={() =>
                  setChatOpenFor((current) =>
                    current === q.supplierId ? null : q.supplierId,
                  )
                }
              />
            ))}
          </div>

          {chatPeer && (
            <div className="mt-4 rounded-2xl border border-border bg-muted/40 px-4 py-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  <ChatWithLabel name={chatPeer.supplierName} />
                </p>
                <button
                  type="button"
                  onClick={() => setChatOpenFor(null)}
                  className={`${ffBtnGhost} w-auto text-sm`}
                >
                  <CloseChatBtn />
                </button>
              </div>
              <ChatPanel
                jobId={jobId}
                peerId={chatPeer.supplierId}
                peerLabel="Tradesperson"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Small helper components to access t() inside non-hook context */
function ChatWithLabel({ name }: { name?: string }) {
  const { t } = useLanguage();
  return <>{t("chatWithLabel").replace("{name}", name ?? "—")}</>;
}
function CloseChatBtn() {
  const { t } = useLanguage();
  return <>{t("closeChatBtn")}</>;
}

function QuoteCompareCard({
  jobId,
  quote: q,
  jobOpen,
  isBestPrice,
  chatOpen,
  acceptingId,
  onAccept,
  onToggleChat,
}: {
  jobId: Id<"jobs">;
  quote: QuoteRow;
  jobOpen: boolean;
  isBestPrice: boolean;
  chatOpen: boolean;
  acceptingId: Id<"quoteRequests"> | null;
  onAccept: () => void;
  onToggleChat: () => void;
}) {
  const unreadCount = useQuery(api.messages.unreadCountForThread, {
    jobId,
    peerId: q.supplierId,
  });
  const unread = unreadCount ?? 0;
  const canAccept = jobOpen && q.status === "quoted";
  const hasQuote = q.status === "quoted" || q.status === "accepted";
  const { t } = useLanguage();

  const statusBadge =
    q.status === "accepted" ? (
      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
        {t("quoteHired")}
      </span>
    ) : q.status === "rejected" ? (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
        {t("quoteNotSelected")}
      </span>
    ) : q.status === "pending" ? (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
        {t("quoteAwaiting")}
      </span>
    ) : null;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 sm:p-5 ${
        q.status === "accepted"
          ? "border-teal-400 bg-teal-50/40 dark:bg-teal-950/20"
          : chatOpen
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            aria-hidden
          >
            {initials(q.supplierName, undefined)}
          </span>
          <p className="truncate text-sm font-semibold text-foreground">
            {q.supplierName ?? "—"}
          </p>
        </div>
        {statusBadge}
      </div>

      <div>
        {hasQuote && q.priceLKR !== undefined ? (
          <p className="flex items-baseline gap-2 text-2xl font-bold tracking-tight text-foreground">
            LKR {q.priceLKR.toLocaleString("en-LK")}
            {isBestPrice && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                {t("bestPrice")}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("waitingForPrice")}</p>
        )}
        {hasQuote &&
          (q.isFinal ? (
            <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
              {t("quoteFinal")}
            </span>
          ) : (
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              {t("quoteNegotiable")}
            </span>
          ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-foreground/80">
        <div>
          <dt className="text-muted-foreground">{t("durationLabel")}</dt>
          <dd>{hasQuote ? (q.duration ?? "-") : "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("distanceLabel")}</dt>
          <dd>{q.distanceKm !== undefined ? `${q.distanceKm.toFixed(1)} ${t("kmAway")}` : "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("ratingLabel")}</dt>
          <dd>
            {q.supplierRating !== undefined ? (
              <>
                <IconStar
                  size={12}
                  filled
                  className="mr-0.5 inline-block align-[-1px] text-amber-500"
                />{" "}
                {q.supplierRating.toFixed(1)}
                {q.supplierReviewCount !== undefined
                  ? ` (${q.supplierReviewCount})`
                  : ""}
              </>
            ) : (
              t("supplierNew")
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("responseLabel")}</dt>
          <dd>
            {q.avgResponseMinutes !== undefined
              ? formatResponseMinutes(q.avgResponseMinutes)
              : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("jobsCompletedLabel")}</dt>
          <dd>{q.completedJobs !== undefined ? q.completedJobs : "0"}</dd>
        </div>
      </dl>

      {q.notes && hasQuote && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {q.notes}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
        {canAccept && (
          <button
            type="button"
            onClick={onAccept}
            disabled={acceptingId !== null}
            className={`${ffBtnPrimary} min-h-[40px] px-3 py-2 text-xs sm:flex-1`}
          >
            {acceptingId === q._id ? t("accepting") : t("acceptBtn")}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleChat}
          className={`${ffBtnGhost} relative min-h-[40px] px-2 py-1.5 text-xs ${canAccept ? "sm:w-auto" : "sm:flex-1"}`}
          aria-expanded={chatOpen}
        >
          {chatOpen ? t("hideChatBtn") : t("messageBtn")}
          {!chatOpen && unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
