import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type LiveQuoteDashboardProps = {
  jobId: Id<"jobs">;
  onBack: () => void;
};

export function LiveQuoteDashboard({ jobId, onBack }: LiveQuoteDashboardProps) {
  const quotes = useQuery(api.quoteRequests.getLiveQuotes, { jobId });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const acceptQuote = useMutation(api.quoteRequests.acceptQuote);
  const [acceptingId, setAcceptingId] = useState<Id<"quoteRequests"> | null>(null);
  const [error, setError] = useState("");

  async function handleAccept(quoteRequestId: Id<"quoteRequests">) {
    setError("");
    setAcceptingId(quoteRequestId);
    try {
      await acceptQuote({ jobId, quoteRequestId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Live quote dashboard
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Quotes update in real time — no refresh needed
          </p>
        </div>
        <div className="relative" title="Unread notifications">
          <span className="text-2xl" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      {quotes === undefined && (
        <p className="text-sm text-gray-500">Loading quotes...</p>
      )}

      {quotes !== undefined && quotes.length === 0 && (
        <div className="border border-gray-200 p-6 text-center">
          <p className="text-sm font-medium">Waiting for quotes</p>
          <p className="text-xs text-gray-500 mt-2">
            Open the supplier dashboard in another window and submit a quote.
            It will appear here within seconds.
          </p>
        </div>
      )}

      {quotes !== undefined && quotes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <li
              key={quote._id}
              className="border border-gray-300 p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-medium">{quote.supplierName}</p>
                  {quote.supplierRating !== undefined && (
                    <p className="text-xs text-gray-500">
                      ★ {quote.supplierRating.toFixed(1)}
                    </p>
                  )}
                </div>
                <span className="text-xs uppercase text-gray-400">
                  {quote.status}
                </span>
              </div>
              <p className="text-lg font-semibold">
                LKR {quote.priceLKR?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Duration: {quote.duration}
              </p>
              {quote.notes && (
                <p className="text-sm text-gray-700">{quote.notes}</p>
              )}
              {!quote.isFinal && (
                <p className="text-xs text-amber-700">Estimate — not final</p>
              )}
              {quote.isFinal && quote.status === "quoted" && (
                <button
                  type="button"
                  onClick={() => handleAccept(quote._id)}
                  disabled={acceptingId === quote._id}
                  className="bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 mt-1"
                >
                  {acceptingId === quote._id ? "Accepting..." : "Accept Quote"}
                </button>
              )}
              {quote.status === "accepted" && (
                <p className="text-xs text-green-700 font-medium">
                  Accepted — job in progress
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="button"
        onClick={onBack}
        className="text-sm underline text-gray-500 self-start"
      >
        ← Back
      </button>
    </div>
  );
}

