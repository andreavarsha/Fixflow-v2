import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChatPanel } from "../messaging/ChatPanel";
import { IconFinding } from "../icons";
import {
  ffBtnPrimary,
  ffInput,
  ffLabel,
} from "../../lib/fixflowUi";
import {
  formatDurationDays,
  formatTimeAgo,
  parseDurationDays,
  supplierUi,
} from "../../lib/supplierDashboardUi";
import { toUserFacingError } from "../../lib/userFacingError";
import { useLanguage } from "../../lib/LanguageContext";

const urgencyStyle = {
  High: "text-primary bg-primary/10 ring-primary/20 dark:bg-primary/15",
  Medium:
    "text-amber-900 bg-amber-50 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/50",
  Low: "text-yellow-foreground bg-yellow/15 ring-yellow/30",
};

/** Distance/zone uses a fixed teal (not the theme `teal` token, which is
 * remapped to yellow on supplier routes) so "place" stays visually distinct. */
const DIST_PILL =
  "text-teal-700 bg-teal-500/10 ring-teal-500/20 dark:text-teal-300 dark:ring-teal-500/30";

export type IncomingQuoteRequest = {
  _id: Id<"quoteRequests">;
  _creationTime: number;
  jobId: Id<"jobs">;
  status: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR?: number;
  duration?: string;
  notes?: string;
  isFinal?: boolean;
  jobDescription?: string;
  jobCategory?: string;
  jobUrgency?: "High" | "Medium" | "Low";
  jobSummary?: string;
  jobSummary_si?: string;
  jobSummary_ta?: string;
  jobStatus?: string;
  jobHasPhoto?: boolean;
  jobPhotoUrl?: string;
  distanceKm?: number;
  zoneName?: string;
  ownerId?: Id<"users">;
  addressNote?: string;
};

const STATUS_ACCENT: Record<IncomingQuoteRequest["status"], string> = {
  pending: "border-l-yellow",
  quoted: "border-l-primary",
  accepted: "border-l-[#4CAF50]",
  rejected: "border-l-muted-foreground/40",
};

type IncomingQuoteCardProps = {
  request: IncomingQuoteRequest;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  chatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
};

export function IncomingQuoteCard({
  request,
  expanded: expandedControlled,
  onExpandedChange,
  chatOpen: chatOpenControlled,
  onChatOpenChange,
}: IncomingQuoteCardProps) {
  const [expandedLocal, setExpandedLocal] = useState(false);
  const [chatOpenLocal, setChatOpenLocal] = useState(false);
  const { language } = useLanguage();

  const t = useMemo(() => supplierUi(language), [language]);

  const expanded = expandedControlled ?? expandedLocal;
  const setExpanded = onExpandedChange ?? setExpandedLocal;
  const chatOpen = chatOpenControlled ?? chatOpenLocal;
  const setChatOpen = onChatOpenChange ?? setChatOpenLocal;

  const unreadCount = useQuery(
    api.messages.unreadCountForThread,
    request.ownerId
      ? { jobId: request.jobId, peerId: request.ownerId }
      : "skip",
  );

  const summaryText = useMemo(() => {
    if (language === "si" && request.jobSummary_si) {
      return request.jobSummary_si;
    }
    if (language === "ta" && request.jobSummary_ta) {
      return request.jobSummary_ta;
    }
    return request.jobSummary ?? request.jobDescription ?? "No summary available.";
  }, [language, request.jobSummary, request.jobSummary_si, request.jobSummary_ta, request.jobDescription]);

  const timeAgo = formatTimeAgo(request._creationTime, t);
  const submittedDays =
    request.duration ? parseDurationDays(request.duration) : "";
  const priceText =
    request.priceLKR !== undefined && request.priceLKR > 0
      ? request.priceLKR.toLocaleString("en-LK")
      : "";

  const accent = expanded ? "border-l-teal-500" : STATUS_ACCENT[request.status];
  const unread = unreadCount ?? 0;

  const distZoneText = [
    request.distanceKm !== undefined ? `${request.distanceKm} km` : null,
    request.zoneName ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  const locationLine = [
    request.distanceKm !== undefined ? t.kmFromYou(String(request.distanceKm)) : null,
    request.zoneName ?? null,
    t.tapForMap,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      id={`supplier-job-${request.jobId}`}
      className={`border-l-4 ${accent}`}
    >
      <article className="px-4 py-4 sm:px-6">
        {/* Triage header — tap to expand (accordion) */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={expanded}
        >
          <Thumb photoUrl={request.jobPhotoUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {request.jobCategory ?? "Repair request"}
              </h3>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {distZoneText && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${DIST_PILL}`}
                >
                  {distZoneText}
                </span>
              )}
              {request.jobUrgency && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${urgencyStyle[request.jobUrgency]}`}
                >
                  {t.urgency(request.jobUrgency)}
                </span>
              )}
            </div>
          </div>
          <span
            className={`mt-1 shrink-0 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {/* Collapsed footer: on-card action / quoted state */}
        {!expanded && request.status === "pending" && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-105 active:scale-[0.99]"
            >
              {t.submitQuote}
            </button>
          </div>
        )}

        {!expanded && request.status === "quoted" && priceText && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-yellow align-middle" />
            {t.quotedLineLabel}{" "}
            <b className="font-semibold text-foreground">
              LKR {priceText}
              {submittedDays ? ` · ${submittedDays} ${submittedDays === "1" ? "day" : "days"}` : ""}
            </b>{" "}
            · {t.awaitingHomeowner}
          </p>
        )}

        {expanded && (
          <div className="mt-4 border-t border-border pt-4">
            {/* 1. Photo */}
            <ExpandedPhoto
              jobId={request.jobId}
              photoUrl={request.jobPhotoUrl}
              hasPhoto={request.jobHasPhoto}
            />

            {/* 2. Description */}
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {summaryText}
            </p>

            {/* 3. Location / distance */}
            {locationLine && (
              <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                <IconFinding size={22} className="shrink-0" />
                <span>{locationLine}</span>
              </div>
            )}

            {request.status === "accepted" && request.addressNote && (
              <div className="mt-4 rounded-xl border border-yellow/30 bg-yellow/10 p-4 text-sm text-foreground">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-foreground">
                  Job address / location details
                </h4>
                <p className="mt-1.5 font-medium leading-relaxed">
                  {request.addressNote}
                </p>
              </div>
            )}

            {/* 4 + 5. "Your quote" block with sticky CTA */}
            <JobActionsSection
              jobId={request.jobId}
              quoteStatus={request.status}
              jobStatus={request.jobStatus}
              initialPrice={request.priceLKR}
              initialDuration={request.duration}
              initialNotes={request.notes}
              initialIsFinal={request.isFinal}
            />

            {/* 6. Message homeowner — secondary link below the CTA */}
            {request.ownerId && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setChatOpen(!chatOpen)}
                  className="relative inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                  aria-expanded={chatOpen}
                >
                  {chatOpen ? "Close chat" : "Message homeowner"}
                  {!chatOpen && unread > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              </div>
            )}

            {chatOpen && request.ownerId && (
              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                <ChatPanel
                  jobId={request.jobId}
                  peerId={request.ownerId}
                  peerLabel="Homeowner"
                />
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

function Thumb({ photoUrl }: { photoUrl?: string }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-secondary text-muted-foreground"
      aria-hidden
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m21 15-4.5-4.5L7 20" />
      </svg>
    </div>
  );
}

function ExpandedPhoto({
  jobId,
  photoUrl,
  hasPhoto,
}: {
  jobId: Id<"jobs">;
  photoUrl?: string;
  hasPhoto?: boolean;
}) {
  // Prefer the URL already delivered with the list; fall back to a lazy query
  // only when the list did not include one but a photo exists.
  const fallback = useQuery(
    api.quoteRequests.getJobPhotoForSupplier,
    !photoUrl && hasPhoto ? { jobId } : "skip",
  );

  const url = photoUrl ?? (fallback?.hasPhoto ? fallback.url : undefined);

  if (photoUrl === undefined && hasPhoto && fallback === undefined) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden />;
  }

  if (!hasPhoto && !url) return null;

  if (url) {
    return (
      <img
        src={url}
        alt="Photo of the issue from the homeowner"
        className="max-h-56 w-full rounded-xl border border-border object-cover sm:max-h-64"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      The homeowner attached a photo, but it could not be loaded. Ask them to
      re-submit the request with the image, or message them for details.
    </p>
  );
}

type JobLifecycleStatus =
  | "classifying"
  | "open"
  | "in_progress"
  | "awaiting_payment"
  | "completed"
  | undefined;

function JobActionsSection({
  jobId,
  quoteStatus,
  jobStatus,
  initialPrice,
  initialDuration,
  initialNotes,
  initialIsFinal,
}: {
  jobId: Id<"jobs">;
  quoteStatus: "pending" | "quoted" | "accepted" | "rejected";
  jobStatus?: string;
  initialPrice: number | undefined;
  initialDuration: string | undefined;
  initialNotes: string | undefined;
  initialIsFinal: boolean | undefined;
}) {
  const submitQuote = useMutation(api.quoteRequests.submitQuote);
  const markWorkComplete = useMutation(api.jobs.supplierMarkWorkComplete);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [priceLKR, setPriceLKR] = useState(
    initialPrice !== undefined ? String(initialPrice) : "",
  );
  const [durationDays, setDurationDays] = useState(
    parseDurationDays(initialDuration),
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isFinal, setIsFinal] = useState(initialIsFinal ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { language, t: tGlobal } = useLanguage();
  const t = useMemo(() => supplierUi(language), [language]);

  const lifecycle = jobStatus as JobLifecycleStatus;

  useEffect(() => {
    setPriceLKR(initialPrice !== undefined ? String(initialPrice) : "");
    setDurationDays(parseDurationDays(initialDuration));
    setNotes(initialNotes ?? "");
    setIsFinal(initialIsFinal ?? false);
  }, [
    initialPrice,
    initialDuration,
    initialNotes,
    initialIsFinal,
    quoteStatus,
  ]);

  async function handleMarkComplete() {
    setCompleteError("");
    setCompleting(true);
    try {
      await markWorkComplete({ jobId });
    } catch (err: unknown) {
      setCompleteError(toUserFacingError(err));
    } finally {
      setCompleting(false);
    }
  }

  if (quoteStatus === "accepted" && lifecycle === "in_progress") {
    return (
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30 sm:p-5">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {tGlobal("supplierJobInProgress")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
          {tGlobal("supplierJobInProgressHint")}
        </p>
        {completeError && (
          <p
            className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {completeError}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleMarkComplete()}
          disabled={completing}
          className={`${ffBtnPrimary} mt-4 sm:max-w-xs`}
        >
          {completing ? tGlobal("supplierSubmitting") : tGlobal("supplierMarkComplete")}
        </button>
      </div>
    );
  }

  if (quoteStatus === "accepted" && lifecycle === "awaiting_payment") {
    return (
      <p className="mt-5 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-primary ring-1 ring-primary/20 dark:bg-primary/15">
        {t.awaitingPayment}
      </p>
    );
  }

  if (quoteStatus === "accepted" && lifecycle === "completed") {
    return (
      <p className="mt-5 rounded-lg bg-yellow/15 px-3 py-2.5 text-sm text-yellow-foreground ring-1 ring-yellow/30">
        {t.jobPaidComplete}
      </p>
    );
  }

  if (quoteStatus === "rejected") {
    return (
      <p className="mt-5 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground ring-1 ring-border">
        {t.notSelected}
      </p>
    );
  }

  const jobOpen = lifecycle === "open";
  const canSubmit =
    jobOpen && (quoteStatus === "pending" || quoteStatus === "quoted");

  if (!jobOpen) {
    return (
      <p className="mt-5 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground ring-1 ring-border">
        {t.jobClosed}
      </p>
    );
  }

  if (!canSubmit) {
    return (
      <p className="mt-5 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground ring-1 ring-border">
        {t.noAction}
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(priceLKR);
    if (!Number.isFinite(price) || price <= 0) {
      setError(t.invalidPrice);
      return;
    }
    const days = Number(durationDays);
    if (!Number.isInteger(days) || days < 1) {
      setError(t.invalidDays);
      return;
    }
    setSubmitting(true);
    try {
      await submitQuote({
        jobId,
        priceLKR: price,
        duration: formatDurationDays(days),
        notes: notes.trim() || undefined,
        isFinal,
      });
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const priceNum = Number(priceLKR);
  const priceEcho =
    Number.isFinite(priceNum) && priceNum > 0
      ? ` · LKR ${priceNum.toLocaleString("en-LK")}`
      : "";
  const ctaLabel = submitting
    ? t.sending
    : `${quoteStatus === "quoted" ? t.updateQuote : t.submitQuote}${priceEcho}`;

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="mt-5 rounded-xl bg-muted/50 p-4 ring-1 ring-border sm:p-5"
    >
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">
          {t.yourQuoteHeader}
        </h4>
        {quoteStatus === "quoted" ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t.quoteSubmittedTitle} ·{" "}
            {initialIsFinal ? t.quoteSubmittedFinal : t.quoteSubmittedDraft}
          </p>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t.sendQuoteHint}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`price-${jobId}`} className={ffLabel}>
            {t.priceLabel}
          </label>
          <input
            id={`price-${jobId}`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={priceLKR}
            onChange={(e) => setPriceLKR(e.target.value)}
            className={ffInput}
            required
          />
        </div>

        <div>
          <label htmlFor={`duration-${jobId}`} className={ffLabel}>
            {t.daysLabel}
          </label>
          <input
            id={`duration-${jobId}`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="1"
            className={ffInput}
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={`notes-${jobId}`} className={ffLabel}>
          {t.notesLabel}{" "}
          <span className="font-normal text-muted-foreground">
            {t.notesOptional}
          </span>
        </label>
        <textarea
          id={`notes-${jobId}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t.notesPlaceholder}
          className={`${ffInput} resize-none`}
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-3 py-3">
        <input
          type="checkbox"
          checked={isFinal}
          onChange={(e) => setIsFinal(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
        />
        <span className="text-sm leading-snug text-foreground/80">
          <span className="font-medium text-foreground">{t.finalQuote}</span>
          <br />
          <span className="text-xs text-muted-foreground">{t.finalQuoteHint}</span>
        </span>
      </label>

      {error && (
        <p
          className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Sticky CTA — stays visible while the expanded card scrolls */}
      <div className="sticky bottom-2 z-10 mt-4">
        <button
          type="submit"
          disabled={submitting}
          className={`${ffBtnPrimary} shadow-lg`}
        >
          {ctaLabel}
        </button>
      </div>
    </form>
  );
}
