import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ffBtnPrimary, ffCard, ffInput, ffLabel } from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";

type AcceptedQuote = {
  priceLKR?: number;
  duration?: string;
  supplierName?: string;
};

type OwnerJobPaymentPanelProps = {
  jobId: Id<"jobs">;
  status: string;
  acceptedQuote: AcceptedQuote | null;
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
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (existing || done || skipped) {
    if (existing || done) {
      return (
        <p className="mt-3 text-sm text-teal-800 dark:text-teal-300">
          Thanks for rating {supplierName ?? "your tradesperson"}.
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

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-4 border-t border-teal-200/60 pt-4 dark:border-teal-900/50"
    >
      <p className="text-sm font-semibold text-foreground">
        Rate {supplierName ?? "your tradesperson"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Optional — helps other homeowners.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`min-h-[40px] min-w-[40px] rounded-full text-sm font-semibold ${
              rating === n
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground ring-1 ring-border"
            }`}
            aria-label={`${n} stars`}
          >
            {n}★
          </button>
        ))}
      </div>
      <label htmlFor={`review-${jobId}`} className={`${ffLabel} mt-3`}>
        Comment (optional)
      </label>
      <textarea
        id={`review-${jobId}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        className={`${ffInput} mt-1 resize-none`}
        placeholder="How was the work?"
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
          {submitting ? "Saving…" : "Submit rating"}
        </button>
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="text-sm text-muted-foreground underline"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}

export function OwnerJobPaymentPanel({
  jobId,
  status,
  acceptedQuote,
}: OwnerJobPaymentPanelProps) {
  const confirmPayment = useMutation(api.jobs.ownerConfirmPayment);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  if (status === "in_progress") {
    return (
      <div
        className={`${ffCard} mb-6 border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/30`}
        role="status"
      >
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Work in progress
        </p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-300">
          {acceptedQuote?.supplierName ?? "Your tradesperson"} is working on this
          repair. You&apos;ll be prompted to pay here once they mark the job
          complete.
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
          Payment complete
        </p>
        <p className="mt-1 text-sm leading-relaxed text-teal-800 dark:text-teal-300">
          Thank you — this job is closed.
          {acceptedQuote?.priceLKR !== undefined && (
            <>
              {" "}
              Paid{" "}
              <span className="font-semibold">
                LKR {acceptedQuote.priceLKR.toLocaleString("en-LK")}
              </span>
              {acceptedQuote.supplierName
                ? ` to ${acceptedQuote.supplierName}`
                : ""}
              .
            </>
          )}
        </p>
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
        Ready to pay
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {acceptedQuote?.supplierName ?? "Your tradesperson"} marked this job
        complete. Confirm payment to close the job.
      </p>

      {price && (
        <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          LKR {price}
          {acceptedQuote?.duration && (
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              Agreed timeline: {acceptedQuote.duration}
            </span>
          )}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Demo only — this records payment in FixFlow; no card is charged.
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
        {paying ? "Processing…" : "Confirm payment"}
      </button>
    </div>
  );
}
