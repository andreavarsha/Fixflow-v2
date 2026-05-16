import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type QuoteSubmitFormProps = {
  jobId: Id<"jobs">;
  jobLabel: string;
  disabled?: boolean;
};

export function QuoteSubmitForm({
  jobId,
  jobLabel,
  disabled,
}: QuoteSubmitFormProps) {
  const submitQuote = useMutation(api.quoteRequests.submitQuote);
  const [priceLKR, setPriceLKR] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(priceLKR);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price in LKR");
      return;
    }
    if (!duration.trim()) {
      setError("Duration is required");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await submitQuote({
        jobId,
        priceLKR: price,
        duration: duration.trim(),
        notes: notes.trim() || undefined,
        isFinal,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm text-green-700">
        Quote submitted — owner dashboard updates live.
      </p>
    );
  }

  if (disabled) {
    return (
      <p className="text-xs text-gray-500">
        Quote already submitted for this request.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2 border-t pt-3">
      <p className="text-xs font-medium text-gray-500">Submit quote · {jobLabel}</p>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Price (LKR)</label>
        <input
          type="number"
          min={1}
          value={priceLKR}
          onChange={(e) => setPriceLKR(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm w-full"
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Estimated duration</label>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 2 hours, same day"
          className="border border-gray-300 px-3 py-2 text-sm w-full"
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border border-gray-300 px-3 py-2 text-sm w-full resize-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFinal}
          onChange={(e) => setIsFinal(e.target.checked)}
        />
        Final quote (owner can accept when checked)
      </label>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Quote"}
      </button>
    </form>
  );
}
