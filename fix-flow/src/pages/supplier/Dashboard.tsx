import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChatPanel } from "../../components/messaging/ChatPanel";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffCard,
  ffInput,
  ffLabel,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";

const urgencyStyle = {
  High: "text-red-700 bg-red-50 ring-red-100",
  Medium: "text-amber-800 bg-amber-50 ring-amber-100",
  Low: "text-emerald-800 bg-emerald-50 ring-emerald-100",
};

export default function SupplierDashboard() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const quoteRequests = useQuery(api.quoteRequests.listForSupplier);
  const [chatOpenFor, setChatOpenFor] = useState<Id<"quoteRequests"> | null>(
    null,
  );

  return (
    <div className={ffPage}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0">
          <h1 className={ffScreenTitle}>Your dashboard</h1>
          <p className={ffScreenSubtitle}>Quote requests and alerts</p>
        </div>
        <div
          className="relative shrink-0 rounded-full bg-white p-2.5 shadow-sm ring-1 ring-gray-200"
          title={unreadCount ? `${unreadCount} unread` : "Notifications"}
        >
          <span className="text-xl leading-none" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </header>

      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Incoming requests
      </h2>

      {quoteRequests === undefined && (
        <p className="text-sm text-gray-500">Loading…</p>
      )}

      {quoteRequests !== undefined && quoteRequests.length === 0 && (
        <div className={`${ffCard} text-sm text-gray-600`}>
          <p className="font-medium text-gray-900">Nothing here yet</p>
          <p className="mt-2 leading-relaxed">
            When a homeowner picks you and asks for a quote, the job summary appears
            below. The bell updates live when there&apos;s news.
          </p>
        </div>
      )}

      {quoteRequests !== undefined && quoteRequests.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3 xl:gap-6">
          {quoteRequests.map((request) => (
            <li key={request._id} className={ffCard}>
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                  {request.status === "pending"
                    ? "Needs your quote"
                    : request.status === "quoted"
                      ? "Quote sent"
                      : request.status}
                </span>
                {request.jobUrgency && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${urgencyStyle[request.jobUrgency]}`}
                  >
                    {request.jobUrgency} urgency
                  </span>
                )}
              </div>
              {request.jobCategory && (
                <p className="mt-4 font-semibold text-gray-900">
                  {request.jobCategory}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {request.jobSummary ?? request.jobDescription}
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

              {request.ownerId && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setChatOpenFor((current) =>
                        current === request._id ? null : request._id,
                      )
                    }
                    className={`${ffBtnGhost} mt-3 self-start text-sm`}
                    aria-expanded={chatOpenFor === request._id}
                  >
                    {chatOpenFor === request._id
                      ? "Close chat"
                      : "Message homeowner"}
                  </button>

                  {chatOpenFor === request._id && (
                    <ChatPanel
                      jobId={request.jobId}
                      peerId={request.ownerId}
                      peerLabel="Homeowner"
                    />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const [duration, setDuration] = useState(initialDuration ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isFinal, setIsFinal] = useState(initialIsFinal ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    jobOpen && (status === "pending" || status === "quoted");

  if (!jobOpen) {
    return (
      <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
        This homeowner has closed quoting for now.
      </p>
    );
  }

  if (!canSubmit) {
    return (
      <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
        No further action needed on this request.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(priceLKR);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price in Sri Lankan Rupees (LKR).");
      return;
    }
    if (!duration.trim()) {
      setError("Add how long the job will take (e.g. 2 days).");
      return;
    }
    setSubmitting(true);
    try {
      await submitQuote({
        jobId,
        priceLKR: price,
        duration: duration.trim(),
        notes: notes.trim() || undefined,
        isFinal,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send quote.");
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
        <h3 className="text-sm font-semibold text-gray-900">Send your quote</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Homeowners see updates instantly. Check &quot;Final quote&quot; when you&apos;re
          happy for them to accept it.
        </p>
      </div>

      <div>
        <label htmlFor={`price-${jobId}`} className={ffLabel}>
          Price (LKR)
        </label>
        <input
          id={`price-${jobId}`}
          type="number"
          inputMode="decimal"
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
          Estimated duration
        </label>
        <input
          id={`duration-${jobId}`}
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. Half day, 2 days"
          className={ffInput}
          required
        />
      </div>

      <div>
        <label htmlFor={`notes-${jobId}`} className={ffLabel}>
          Notes <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id={`notes-${jobId}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Materials, access, warranty…"
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
          <span className="font-medium text-gray-900">This is my final quote</span>
          <br />
          <span className="text-xs text-gray-500">
            The homeowner can only accept after this is checked.
          </span>
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={`${ffBtnPrimary} xl:max-w-md xl:self-start`}>
        {submitting ? "Sending…" : status === "quoted" ? "Update quote" : "Submit quote"}
      </button>
    </form>
  );
}
