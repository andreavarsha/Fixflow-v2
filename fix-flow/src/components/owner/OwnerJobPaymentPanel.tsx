import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { IconStar } from "../icons";
import { downloadJobInvoice } from "./JobInvoice";
import { ffBtnPrimary, ffBtnSecondary, ffCard, ffInput, ffLabel } from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";
import { zoneByIdName } from "../../lib/zones";
import { useLanguage } from "../../lib/LanguageContext";

type AcceptedQuote = {
  priceLKR?: number;
  duration?: string;
  supplierName?: string;
};

type OwnerJobPaymentPanelProps = {
  jobId: Id<"jobs">;
  status: string;
  acceptedQuote: AcceptedQuote | null;
  description?: string;
  category?: string;
  zoneId?: string;
  paidAt?: number;
};

function RatingPrompt({
  jobId,
  supplierName,
}: {
  jobId: Id<"jobs">;
  supplierName?: string;
}) {
  const existing = useQuery(api.reviews.getReviewForJob, { jobId });
  const submitReview = useMutation(api.reviews.submitReview);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { t } = useLanguage();

  const displayName = supplierName ?? "—";

  if (existing || done || skipped) {
    if (existing || done) {
      return (
        <p className="mt-3 text-sm text-teal-800 dark:text-teal-300">
          {t("thankYouRating").replace("{name}", displayName)}
        </p>
      );
    }
    return null;
  }

  if (existing === undefined) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitReview({
        jobId,
        rating,
        comment: comment.trim() || undefined,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const display = hover ?? rating;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-4 border-t border-teal-200/60 pt-4 dark:border-teal-900/50"
    >
      <p className="text-sm font-semibold text-foreground">
        {t("rateTraderTitle").replace("{name}", displayName)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("ratingOptionalHint")}
      </p>
      <div
        className="mt-3 flex gap-1"
        role="radiogroup"
        aria-label="Star rating"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 text-amber-400 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <IconStar size={22} filled={n <= display} />
          </button>
        ))}
      </div>
      <label className={`${ffLabel} mt-3`} htmlFor="rating-comment">
        Comment <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="rating-comment"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={`${ffInput} mt-1 resize-none`}
        placeholder={t("ratingOptionalHint")}
      />
      {error && (
        <p
          className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className={ffBtnPrimary}>
          {submitting ? t("savingRating") : t("submitRatingBtn")}
        </button>
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="text-sm text-muted-foreground underline"
        >
          {t("skipForNow")}
        </button>
      </div>
    </form>
  );
}

export function OwnerJobPaymentPanel({
  jobId,
  status,
  acceptedQuote,
  description = "",
  category,
  zoneId,
  paidAt,
}: OwnerJobPaymentPanelProps) {
  const confirmPayment = useMutation(api.jobs.ownerConfirmPayment);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const supplierName = acceptedQuote?.supplierName ?? "—";

  if (status === "in_progress") {
    return (
      <div
        className={`${ffCard} mb-6 border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/30`}
        role="status"
      >
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          {t("workInProgress")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-300">
          {t("workInProgressDesc").replace("{name}", supplierName)}
        </p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div
        className={`${ffCard} mb-6 border-teal-100 bg-teal-50/60 dark:border-teal-900/40 dark:bg-teal-950/30`}
        role="status"
      >
        <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
          {t("paymentComplete")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-teal-800 dark:text-teal-300">
          {t("paymentCompleteDesc")}
          {acceptedQuote?.priceLKR !== undefined && (
            <>
              {" "}
              {t("paidTo")}{" "}
              <span className="font-semibold">
                LKR {acceptedQuote.priceLKR.toLocaleString("en-LK")}
              </span>
              {acceptedQuote.supplierName
                ? ` ${t("paidToSuffix").replace("{name}", acceptedQuote.supplierName)}`
                : ""}
              .
            </>
          )}
        </p>
        <button
          type="button"
          className={`${ffBtnSecondary} mt-4 sm:max-w-xs`}
          onClick={() =>
            downloadJobInvoice({
              jobId,
              category,
              zoneName: zoneByIdName(zoneId) ?? undefined,
              description,
              supplierName: acceptedQuote?.supplierName,
              priceLKR: acceptedQuote?.priceLKR,
              duration: acceptedQuote?.duration,
              paidAt,
            })
          }
        >
          {t("downloadInvoice")}
        </button>
        <RatingPrompt
          jobId={jobId}
          supplierName={acceptedQuote?.supplierName}
        />
      </div>
    );
  }

  if (status !== "awaiting_payment") return null;

  async function handlePay() {
    setError("");
    setPaying(true);
    try {
      await confirmPayment({ jobId });
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setPaying(false);
    }
  }

  const price =
    acceptedQuote?.priceLKR !== undefined
      ? acceptedQuote.priceLKR.toLocaleString("en-LK")
      : null;

  return (
    <div
      className={`${ffCard} mb-6 border-primary/25 bg-gradient-to-br from-primary/5 to-card`}
      role="region"
      aria-labelledby="pay-heading"
    >
      <p
        id="pay-heading"
        className="text-lg font-semibold text-foreground sm:text-xl"
      >
        {t("readyToPay")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("readyToPayDesc").replace("{name}", supplierName)}
      </p>

      {price && (
        <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          LKR {price}
          {acceptedQuote?.duration && (
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {t("agreedTimeline")} {acceptedQuote.duration}
            </span>
          )}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t("demoOnlyNote")}
      </p>

      {error && (
        <p
          className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={paying}
        className={`${ffBtnPrimary} mt-5 sm:max-w-xs`}
      >
        {paying ? t("processingPayment") : t("confirmPaymentBtn")}
      </button>
    </div>
  );
}
