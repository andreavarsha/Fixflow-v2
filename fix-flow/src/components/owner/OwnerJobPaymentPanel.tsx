import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ffBtnPrimary, ffCard } from "../../lib/fixflowUi";
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
