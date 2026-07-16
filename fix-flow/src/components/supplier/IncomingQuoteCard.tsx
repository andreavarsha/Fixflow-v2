import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChatPanel } from "../messaging/ChatPanel";
import { JobIssuePhoto } from "./JobIssuePhoto";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffInput,
  ffLabel,
} from "../../lib/fixflowUi";
import {
  formatDurationDays,
  parseDurationDays,
  statusBadgeClass,
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

export type IncomingQuoteRequest = {
  _id: Id<"quoteRequests">;
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
  ownerId?: Id<"users">;
  addressNote?: string;
};

const STATUS_ACCENT: Record<IncomingQuoteRequest["status"], string> = {
  pending: "border-l-amber-500",
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

  const statusLabel =
    request.status === "pending"
      ? t.statusPending
      : request.status === "quoted"
        ? t.statusQuoted
        : request.status === "accepted"
          ? t.statusAccepted
          : request.status === "rejected"
            ? t.statusRejected
            : request.status;

  const submittedDays =
    request.status === "quoted" && request.duration
      ? parseDurationDays(request.duration)
      : "";

  const accent = STATUS_ACCENT[request.status];
  const unread = unreadCount ?? 0;

  return (
    <li
      id={`supplier-job-${request.jobId}`}
      className={`border-l-4 ${accent}`}
    >
      <article className="px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start justify-between gap-3 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(request.status)}`}
              >
                {statusLabel}
              </span>
              {request.jobUrgency && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${urgencyStyle[request.jobUrgency]}`}
                >
                  {request.jobUrgency}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
              {request.jobCategory ?? "Repair request"}
            </h3>
            {!expanded && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {summaryText}
              </p>
            )}
          </div>
          <span
            className={`mt-1 shrink-0 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {expanded && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {request.ownerId && (
                <button
                  type="button"
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`${ffBtnSecondary} relative shrink-0 text-sm sm:max-w-[12rem]`}
                  aria-expanded={chatOpen}
                >
                  {chatOpen ? "Close chat" : "Message homeowner"}
                  {!chatOpen && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              )}
            </div>

            <JobIssuePhoto jobId={request.jobId} />

            {request.status === "quoted" &&
              request.priceLKR !== undefined &&
              request.priceLKR > 0 && (
                <div
                  className="mt-4 rounded-xl bg-yellow/15 px-4 py-3 ring-1 ring-yellow/30"
                  role="status"
                >
                  <p className="text-sm font-semibold text-yellow-foreground">
                    {t.quoteSubmittedTitle}
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    {t.quoteSubmittedPrice(
                      request.priceLKR.toLocaleString("en-LK"),
                    )}
                    {submittedDays
                      ? ` · ${t.quoteSubmittedDays(Number(submittedDays))}`
                      : request.duration
                        ? ` · ${request.duration}`
                        : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.isFinal
                      ? t.quoteSubmittedFinal
                      : t.quoteSubmittedDraft}
                  </p>
                </div>
              )}

            <p className="mt-3 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {summaryText}
            </p>

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

            {chatOpen && request.ownerId && (
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                <ChatPanel
                  jobId={request.jobId}
                  peerId={request.ownerId}
                  peerLabel="Homeowner"
                />
              </div>
            )}

            <JobActionsSection
              jobId={request.jobId}
              quoteStatus={request.status}
              jobStatus={request.jobStatus}
              initialPrice={request.priceLKR}
              initialDuration={request.duration}
              initialNotes={request.notes}
              initialIsFinal={request.isFinal}
            />
          </div>
        )}
      </article>
    </li>
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
  const { language } = useLanguage();
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
          Job in progress
        </p>
        <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
          When the repair is finished on site, confirm below. The homeowner will
          be asked to pay the agreed quote amount.
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
          {completing ? "Submitting…" : "Mark job complete"}
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

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="mt-5 rounded-xl bg-muted/50 p-4 ring-1 ring-border sm:p-5"
    >
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">{t.sendQuote}</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t.sendQuoteHint}
        </p>
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

      <button
        type="submit"
        disabled={submitting}
        className={`${ffBtnPrimary} mt-4 sm:max-w-xs`}
      >
        {submitting
          ? t.sending
          : quoteStatus === "quoted"
            ? t.updateQuote
            : t.submitQuote}
      </button>
    </form>
  );
}
