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
        <p className="mt-3 text-sm text-emerald-800">
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
      className="mt-4 border-t border-emerald-100 pt-4"
    >
      <p className="text-sm font-semibold text-gray-900">
        Rate {supplierName ?? "your tradesperson"}
      </p>
      <p className="mt-1 text-xs text-gray-600">Optional — helps other homeowners.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`min-h-[40px] min-w-[40px] rounded-full text-sm font-semibold ${
              rating === n
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200"
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
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
          className="text-sm text-gray-600 underline"
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
        className={`${ffCard} mb-6 border-blue-100 bg-blue-50/60`}
        role="status"
      >
        <p className="text-sm font-semibold text-blue-900">Work in progress</p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800">
          {acceptedQuote?.supplierName ?? "Your tradesperson"} is working on this
          repair. You&apos;ll be prompted to pay here once they mark the job
          complete.
        </p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className={`${ffCard} mb-6 border-emerald-100 bg-emerald-50/60`} role="status">
        <p className="text-sm font-semibold text-emerald-900">Payment complete</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-800">
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
      className={`${ffCard} mb-6 border-violet-200 bg-gradient-to-br from-violet-50 to-white`}
      role="region"
      aria-labelledby="pay-heading"
    >
      <p
        id="pay-heading"
        className="text-lg font-semibold text-gray-900 sm:text-xl"
      >
        Ready to pay
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {acceptedQuote?.supplierName ?? "Your tradesperson"} marked this job
        complete. Confirm payment to close the job.
      </p>

      {price && (
        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          LKR {price}
          {acceptedQuote?.duration && (
            <span className="mt-1 block text-sm font-normal text-gray-500">
              Agreed timeline: {acceptedQuote.duration}
            </span>
          )}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Demo only — this records payment in FixFlow; no card is charged.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
