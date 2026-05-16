import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChatPanel } from "../messaging/ChatPanel";
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
  type SupplierLang,
} from "../../lib/supplierDashboardUi";
import { toUserFacingError } from "../../lib/userFacingError";

const urgencyStyle = {
  High: "text-red-800 bg-red-50 ring-red-100",
  Medium: "text-amber-900 bg-amber-50 ring-amber-100",
  Low: "text-emerald-900 bg-emerald-50 ring-emerald-100",
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
};

const SUMMARY_TAB_LABELS: { id: SupplierLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "si", label: "සිංහල" },
  { id: "ta", label: "தமிழ்" },
];

const t = supplierUi("en");

const STATUS_ACCENT: Record<IncomingQuoteRequest["status"], string> = {
  pending: "border-l-amber-500",
  quoted: "border-l-emerald-500",
  accepted: "border-l-blue-500",
  rejected: "border-l-gray-400",
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
  const [summaryLang, setSummaryLang] = useState<SupplierLang>("en");
  const [chatOpenLocal, setChatOpenLocal] = useState(false);

  const chatOpen = chatOpenControlled ?? chatOpenLocal;
  const setChatOpen = onChatOpenChange ?? setChatOpenLocal;

  const unreadCount = useQuery(
    api.messages.unreadCountForThread,
    request.ownerId
      ? { jobId: request.jobId, peerId: request.ownerId }
      : "skip",
  );

  const langTabs = useMemo(() => {
    const tabs: { id: SupplierLang; label: string }[] = [
      SUMMARY_TAB_LABELS[0],
    ];
    if (request.jobSummary_si?.trim()) {
      tabs.push(SUMMARY_TAB_LABELS[1]);
    }
    if (request.jobSummary_ta?.trim()) {
      tabs.push(SUMMARY_TAB_LABELS[2]);
    }
    return tabs;
  }, [request.jobSummary_si, request.jobSummary_ta]);

  useEffect(() => {
    if (summaryLang === "si" && !request.jobSummary_si?.trim()) {
      setSummaryLang("en");
    }
    if (summaryLang === "ta" && !request.jobSummary_ta?.trim()) {
      setSummaryLang("en");
    }
  }, [request.jobSummary_si, request.jobSummary_ta, summaryLang]);

  const summaryText =
    summaryLang === "si"
      ? (request.jobSummary_si ?? request.jobSummary)
      : summaryLang === "ta"
        ? (request.jobSummary_ta ?? request.jobSummary)
        : request.jobSummary;

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
              <h3 className="mt-2 text-base font-semibold text-gray-900 sm:text-lg">
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
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}
        </div>

        {request.status === "quoted" &&
          request.priceLKR !== undefined &&
          request.priceLKR > 0 && (
            <div
              className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100"
              role="status"
            >
              <p className="text-sm font-semibold text-emerald-900">
                {t.quoteSubmittedTitle}
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                {t.quoteSubmittedPrice(request.priceLKR.toLocaleString("en-LK"))}
                {submittedDays
                  ? ` · ${t.quoteSubmittedDays(Number(submittedDays))}`
                  : request.duration
                    ? ` · ${request.duration}`
                    : ""}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {request.isFinal ? t.quoteSubmittedFinal : t.quoteSubmittedDraft}
              </p>
            </div>
          )}

        {langTabs.length > 1 && (
          <div
            className="mt-4 flex flex-wrap gap-2"
            role="tablist"
            aria-label={t.summaryLanguage}
          >
            {langTabs.map(({ id, label }) => {
              const selected = summaryLang === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSummaryLang(id)}
                  className={
                    selected
                      ? "rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                      : "rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-200"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          {summaryText ?? request.jobDescription}
        </p>

        {chatOpen && request.ownerId && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3 sm:p-4">
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

  if (quoteStatus === "accepted" && lifecycle === "in_progress") {
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

    return (
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/80 p-4 sm:p-5">
        <p className="text-sm font-semibold text-blue-900">Job in progress</p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800">
          When the repair is finished on site, confirm below. The homeowner will
          be asked to pay the agreed quote amount.
        </p>
        {completeError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
      <p className="mt-5 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-900 ring-1 ring-violet-100">
        {t.awaitingPayment}
      </p>
    );
  }

  if (quoteStatus === "accepted" && lifecycle === "completed") {
    return (
      <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-100">
        {t.jobPaidComplete}
      </p>
    );
  }

  if (quoteStatus === "rejected") {
    return (
      <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-100">
        {t.notSelected}
      </p>
    );
  }

  const jobOpen = lifecycle === "open";
  const canSubmit =
    jobOpen && (quoteStatus === "pending" || quoteStatus === "quoted");

  if (!jobOpen) {
    return (
      <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-100">
        {t.jobClosed}
      </p>
    );
  }

  if (!canSubmit) {
    return (
      <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-100">
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
      onSubmit={handleSubmit}
      className="mt-5 rounded-xl bg-gray-50/90 p-4 ring-1 ring-gray-100 sm:p-5"
    >
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900">{t.sendQuote}</h4>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
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
          <span className="font-normal text-gray-500">{t.notesOptional}</span>
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

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3">
        <input
          type="checkbox"
          checked={isFinal}
          onChange={(e) => setIsFinal(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span className="text-sm leading-snug text-gray-700">
          <span className="font-medium text-gray-900">{t.finalQuote}</span>
          <br />
          <span className="text-xs text-gray-500">{t.finalQuoteHint}</span>
        </span>
      </label>

      {error && (
        <p
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
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
