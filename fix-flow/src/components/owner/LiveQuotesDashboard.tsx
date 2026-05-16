import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { OwnerStepHint } from "../layout/OwnerStepHint";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffBtnInRow,
  ffCard,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";

type LiveQuotesDashboardProps = {
  jobId: Id<"jobs">;
  onBack: () => void;
};

export function LiveQuotesDashboard({ jobId, onBack }: LiveQuotesDashboardProps) {
  const quotes = useQuery(api.quoteRequests.getLiveQuotes, { jobId });
  const job = useQuery(api.jobs.getJob, { jobId });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const acceptQuote = useMutation(api.quoteRequests.acceptQuote);
  const [acceptingId, setAcceptingId] = useState<Id<"quoteRequests"> | null>(
    null,
  );
  const [acceptError, setAcceptError] = useState("");

  const jobOpen = job?.status === "open";

  async function handleAccept(quoteRequestId: Id<"quoteRequests">) {
    setAcceptError("");
    setAcceptingId(quoteRequestId);
    try {
      await acceptQuote({ jobId, quoteRequestId });
    } catch (err: unknown) {
      setAcceptError(
        err instanceof Error ? err.message : "Could not accept quote",
      );
    } finally {
      setAcceptingId(null);
    }
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: "Awaiting quote",
      quoted: "Received",
      accepted: "Accepted",
      rejected: "Not selected",
    };
    return map[s] ?? s;
  };

  return (
    <div className={ffPage}>
      <OwnerStepHint active={3} />

      <button type="button" onClick={onBack} className={`${ffBtnGhost} -mt-1 mb-4 text-left`}>
        ← Back to job details
      </button>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0 flex-1">
          <h1 className={ffScreenTitle}>Quote inbox</h1>
          <p className={ffScreenSubtitle}>
            New quotes appear here automatically as suppliers respond.
          </p>
        </div>
        <div
          className="relative shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200"
          title={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <span className="text-xl leading-none" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </header>

      {quotes === undefined && (
        <p className="text-sm text-gray-500">Loading quotes…</p>
      )}

      {quotes !== undefined && quotes.length === 0 && (
        <div className={`${ffCard} text-sm text-gray-600`}>
          <p className="font-medium text-gray-900">No requests sent yet</p>
          <p className="mt-2 leading-relaxed">
            Go back and choose up to three suppliers. After they submit prices,
            you&apos;ll see them listed here — cheapest first.
          </p>
        </div>
      )}

      {acceptError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {acceptError}
        </p>
      )}

      {job && !jobOpen && (
        <div className={`${ffCard} mb-4 text-sm text-gray-700`}>
          <p>
            <span className="font-medium text-gray-900">Job status:</span>{" "}
            {job.status === "in_progress"
              ? "You’ve accepted a quote — work can begin."
              : job.status}
          </p>
        </div>
      )}

      {quotes !== undefined && quotes.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {quotes.map((q) => (
            <li key={q._id} className={`${ffCard} flex h-full flex-col`}>
              <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {q.supplierName ?? "Supplier"}
                  </p>
                  {q.supplierRating !== undefined && (
                    <p className="mt-0.5 text-sm text-gray-600">
                      ★ {q.supplierRating.toFixed(1)} rating
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {statusLabel(q.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-1 flex-col gap-2">
                {q.status === "quoted" || q.status === "accepted" ? (
                  <>
                    <p className="text-lg font-bold text-gray-900">
                      LKR{" "}
                      {q.priceLKR !== undefined
                        ? q.priceLKR.toLocaleString("en-LK")
                        : "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-500">Time estimate:</span>{" "}
                      {q.duration ?? "—"}
                    </p>
                    {q.notes && (
                      <p className="text-sm leading-relaxed text-gray-700">
                        <span className="font-medium text-gray-600">Note:</span>{" "}
                        {q.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Final quote (owner can accept):{" "}
                      <span className="font-medium text-gray-800">
                        {q.isFinal ? "Yes" : "No — ask supplier to mark final"}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm italic text-gray-500">
                    Waiting for this supplier to send their quote…
                  </p>
                )}
              </div>

              {jobOpen &&
                q.status === "quoted" &&
                q.isFinal === true && (
                  <button
                    type="button"
                    onClick={() => handleAccept(q._id)}
                    disabled={acceptingId !== null}
                    className={`${ffBtnPrimary} ${ffBtnInRow} mt-auto pt-5`}
                  >
                    {acceptingId === q._id ? "Accepting…" : "Accept this quote"}
                  </button>
                )}

              {jobOpen &&
                q.status === "quoted" &&
                q.isFinal !== true && (
                  <p className="mt-auto mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
                    You can accept only after the supplier marks this as their{" "}
                    <strong>final</strong> quote.
                  </p>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
