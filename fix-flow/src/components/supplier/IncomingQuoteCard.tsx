import { useEffect, useState } from "react";
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

const urgencyStyle = {
  High: "text-primary bg-primary/10 ring-primary/20 dark:bg-primary/15",
  Medium:
    "text-amber-900 bg-amber-50 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/50",
  Low: "text-teal-900 bg-teal-50 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-900/50",
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

const t = supplierUi("en");

const STATUS_ACCENT: Record<IncomingQuoteRequest["status"], string> = {
  pending: "border-l-amber-500",
  quoted: "border-l-primary",
  accepted: "border-l-[#4CAF50]",
  rejected: "border-l-muted-foreground/40",
};

type IncomingQuoteCardProps = {
  request: IncomingQuoteRequest;
  chatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
};

export function IncomingQuoteCard({
  request,
  chatOpen: chatOpenControlled,
  onChatOpenChange,
}: IncomingQuoteCardProps) {
  const [chatOpenLocal, setChatOpenLocal] = useState(false);

  const chatOpen = chatOpenControlled ?? chatOpenLocal;
  const setChatOpen = onChatOpenChange ?? setChatOpenLocal;

  const unreadCount = useQuery(
    api.messages.unreadCountForThread,
    request.ownerId
      ? { jobId: request.jobId, peerId: request.ownerId }
      : "skip",
  );

  const [selectedLang, setSelectedLang] = useState<"en" | "si" | "ta">("en");

  const summaryText =
    selectedLang === "si"
      ? (request.jobSummary_si ?? request.jobSummary ?? request.jobDescription)
      : selectedLang === "ta"
        ? (request.jobSummary_ta ?? request.jobSummary ?? request.jobDescription)
        : (request.jobSummary ?? request.jobDescription);

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
      <article className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
            {request.jobCategory && (
              <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                {request.jobCategory}
              </h3>
            )}
          </div>

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
              className="mt-4 rounded-xl bg-teal-50 px-4 py-3 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:ring-teal-900/50"
              role="status"
            >
              <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
                {t.quoteSubmittedTitle}
              </p>
              <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
                {t.quoteSubmittedPrice(request.priceLKR.toLocaleString("en-LK"))}
                {submittedDays
                  ? ` · ${t.quoteSubmittedDays(Number(submittedDays))}`
                  : request.duration
                    ? ` · ${request.duration}`
                    : ""}
              </p>
              <p className="mt-1 text-xs text-teal-700 dark:text-teal-400">
                {request.isFinal ? t.quoteSubmittedFinal : t.quoteSubmittedDraft}
              </p>
            </div>
          )}

        {/* Translation tabs */}
        <div className="mt-4 flex gap-1.5 border-b border-border text-xs">
          <button
            type="button"
            onClick={() => setSelectedLang("en")}
            className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
              selectedLang === "en"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang("si")}
            className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
              selectedLang === "si"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            සිංහල
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang("ta")}
            className={`px-3 py-1.5 font-semibold transition-colors border-b-2 ${
              selectedLang === "ta"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            தமிழ்
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {summaryText}
        </p>

        {request.status === "accepted" && request.addressNote && (
          <div className="mt-4 rounded-xl bg-teal-50/50 p-4 text-sm text-teal-900 border border-teal-100/80 dark:bg-teal-950/20 dark:text-teal-200 dark:border-teal-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
              📍 Job Address / Location details
            </h4>
            <p className="mt-1.5 font-medium leading-relaxed">{request.addressNote}</p>
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
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/40 dark:bg-blue-950/30 sm:p-5">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Job in progress
        </p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-300">
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
      <p className="mt-5 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-900 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-900/50">
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
          <span className="font-normal text-muted-foreground">{t.notesOptional}</span>
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
