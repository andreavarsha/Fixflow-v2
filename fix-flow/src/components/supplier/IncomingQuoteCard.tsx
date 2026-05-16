import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ffBtnPrimary,
  ffCard,
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
  High: "text-red-700 bg-red-50 ring-red-100",
  Medium: "text-amber-800 bg-amber-50 ring-amber-100",
  Low: "text-emerald-800 bg-emerald-50 ring-emerald-100",
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
};

const SUMMARY_TAB_LABELS: { id: SupplierLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "si", label: "සිංහල" },
  { id: "ta", label: "தமிழ்" },
];

/** UI labels and form copy are always English. */
const t = supplierUi("en");

export function IncomingQuoteCard({
  request,
}: {
  request: IncomingQuoteRequest;
}) {
  const [summaryLang, setSummaryLang] = useState<SupplierLang>("en");

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

  return (
    <li className={ffCard}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(request.status)}`}
        >
          {statusLabel}
        </span>
        {request.jobUrgency && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${urgencyStyle[request.jobUrgency]}`}
          >
            {request.jobUrgency} urgency
          </span>
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

      {request.jobCategory && (
        <p className="mt-4 font-semibold text-gray-900">{request.jobCategory}</p>
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

      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        {summaryText ?? request.jobDescription}
      </p>

      <QuoteSubmitSection
        jobId={request.jobId}
        status={request.status}
        jobOpen={request.jobStatus === "open"}
        initialPrice={request.priceLKR}
        initialDuration={request.duration}
        initialNotes={request.notes}
        initialIsFinal={request.isFinal}
      />
    </li>
  );
}

function QuoteSubmitSection({
  jobId,
  status,
  jobOpen,
  initialPrice,
  initialDuration,
  initialNotes,
  initialIsFinal,
}: {
  jobId: Id<"jobs">;
  status: "pending" | "quoted" | "accepted" | "rejected";
  jobOpen: boolean;
  initialPrice: number | undefined;
  initialDuration: string | undefined;
  initialNotes: string | undefined;
  initialIsFinal: boolean | undefined;
}) {
  const submitQuote = useMutation(api.quoteRequests.submitQuote);
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
    status,
  ]);

  const canSubmit =
    jobOpen && (status === "pending" || status === "quoted");

  if (!jobOpen) {
    return (
      <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
        {t.jobClosed}
      </p>
    );
  }

  if (!canSubmit) {
    return (
      <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
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
      className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{t.sendQuote}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          {t.sendQuoteHint}
        </p>
      </div>

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

      <div>
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

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 px-3 py-3 ring-1 ring-gray-100">
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
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`${ffBtnPrimary} xl:max-w-md xl:self-start`}
      >
        {submitting
          ? t.sending
          : status === "quoted"
            ? t.updateQuote
            : t.submitQuote}
      </button>
    </form>
  );
}