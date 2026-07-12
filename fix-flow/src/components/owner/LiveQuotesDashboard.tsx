import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { OwnerStepHint } from "../layout/OwnerStepHint";
import { ChatPanel } from "../messaging/ChatPanel";
import { SupplierDiscoveryMap } from "./SupplierDiscoveryMap";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffBtnInRow,
  ffCard,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";

type LiveQuotesDashboardProps = {
  jobId: Id<"jobs">;
  onBack: () => void;
  onGoToSuppliers: () => void;
  onStepClick?: (step: 1 | 2 | 3) => void;
  canGoToStep?: (step: 1 | 2 | 3) => boolean;
};

export function LiveQuotesDashboard({
  jobId,
  onBack,
  onGoToSuppliers,
  onStepClick,
  canGoToStep,
}: LiveQuotesDashboardProps) {
  const quotes = useQuery(api.quoteRequests.getLiveQuotes, { jobId });
  const job = useQuery(api.jobs.getJob, { jobId });
  const nearby = useQuery(api.suppliers.getSuppliersNearJob, { jobId });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const acceptQuote = useMutation(api.quoteRequests.acceptQuote);
  const [acceptingId, setAcceptingId] = useState<Id<"quoteRequests"> | null>(
    null,
  );
  const [acceptError, setAcceptError] = useState("");
  const [chatOpenFor, setChatOpenFor] = useState<Id<"users"> | null>(null);

  const jobOpen = job?.status === "open";
  const canPickMoreSuppliers = jobOpen && Boolean(job?.category);
  const quoted = (quotes ?? []).filter(
    (q) => q.status === "quoted" || q.status === "accepted",
  );

  async function handleAccept(quoteRequestId: Id<"quoteRequests">) {
    setAcceptError("");
    setAcceptingId(quoteRequestId);
    try {
      await acceptQuote({ jobId, quoteRequestId });
    } catch (err: unknown) {
      setAcceptError(toUserFacingError(err));
    } finally {
      setAcceptingId(null);
    }
  }

  const mapSuppliers = (nearby ?? []).filter((s) =>
    (quotes ?? []).some((q) => q.supplierId === s._id),
  );

  return (
    <div className={ffPage}>
      <OwnerStepHint
        active={3}
        onStepClick={onStepClick}
        canGoToStep={canGoToStep}
      />

      <div className="-mt-1 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={onBack} className={`${ffBtnGhost} text-left`}>
          ← Job details
        </button>
        {canPickMoreSuppliers && (
          <button
            type="button"
            onClick={onGoToSuppliers}
            className={`${ffBtnGhost} text-left`}
          >
            Choose suppliers →
          </button>
        )}
      </div>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0 flex-1">
          <h1 className={ffScreenTitle}>Quote inbox</h1>
          <p className={ffScreenSubtitle}>
            Compare quotes side-by-side. New prices appear live — no refresh.
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

      {job?.lat !== undefined && job.lng !== undefined && mapSuppliers.length > 0 && (
        <div className="mb-6">
          <SupplierDiscoveryMap
            jobLat={job.lat}
            jobLng={job.lng}
            suppliers={mapSuppliers}
            selected={[]}
            onToggle={() => undefined}
            heightClassName="h-48 sm:h-56"
            compact
          />
        </div>
      )}

      {quotes === undefined && (
        <p className="text-sm text-gray-500">Loading quotes…</p>
      )}

      {quotes !== undefined && quotes.length === 0 && (
        <div className={`${ffCard} flex flex-col gap-4 text-sm text-gray-600`}>
          <div>
            <p className="font-medium text-gray-900">No requests sent yet</p>
            <p className="mt-2 leading-relaxed">
              Choose up to three suppliers first. After they submit prices,
              you&apos;ll compare them here.
            </p>
          </div>
          {canPickMoreSuppliers && (
            <button
              type="button"
              onClick={onGoToSuppliers}
              className={`${ffBtnPrimary} self-start`}
            >
              Choose suppliers
            </button>
          )}
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
              ? "Quote accepted — the tradesperson is working on site."
              : job.status === "awaiting_payment"
                ? "Work marked complete — confirm payment on the job page."
                : job.status === "completed"
                  ? "Paid and closed."
                  : job.status}
          </p>
        </div>
      )}

      {quoted.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Final</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {quoted.map((q) => {
                const canAccept =
                  jobOpen && q.status === "quoted" && q.isFinal === true;
                return (
                  <tr key={q._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {q.supplierName ?? "Supplier"}
                      {q.status === "accepted" && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                          Hired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {q.priceLKR !== undefined
                        ? `LKR ${q.priceLKR.toLocaleString("en-LK")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{q.duration ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {q.supplierRating !== undefined
                        ? `★ ${q.supplierRating.toFixed(1)}`
                        : "—"}
                      {q.supplierReviewCount !== undefined
                        ? ` (${q.supplierReviewCount})`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {q.isFinal ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      {canAccept ? (
                        <button
                          type="button"
                          onClick={() => void handleAccept(q._id)}
                          disabled={acceptingId !== null}
                          className={`${ffBtnPrimary} ${ffBtnInRow} text-xs`}
                        >
                          {acceptingId === q._id ? "Accepting…" : "Accept"}
                        </button>
                      ) : q.status === "quoted" && !q.isFinal ? (
                        <span className="text-xs text-amber-800">Awaiting final</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {quotes !== undefined && quotes.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {quotes.map((q) => (
            <QuoteInboxCard
              key={q._id}
              jobId={jobId}
              quote={q}
              jobOpen={jobOpen}
              chatOpen={chatOpenFor === q.supplierId}
              onToggleChat={() =>
                setChatOpenFor((current) =>
                  current === q.supplierId ? null : q.supplierId,
                )
              }
              onAccept={() => void handleAccept(q._id)}
              acceptingId={acceptingId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function QuoteInboxCard({
  jobId,
  quote: q,
  jobOpen,
  chatOpen,
  onToggleChat,
  onAccept,
  acceptingId,
}: {
  jobId: Id<"jobs">;
  quote: {
    _id: Id<"quoteRequests">;
    supplierId: Id<"users">;
    status: string;
    priceLKR?: number;
    duration?: string;
    notes?: string;
    isFinal?: boolean;
    supplierName?: string;
    supplierRating?: number;
    supplierReviewCount?: number;
  };
  jobOpen: boolean;
  chatOpen: boolean;
  onToggleChat: () => void;
  onAccept: () => void;
  acceptingId: Id<"quoteRequests"> | null;
}) {
  const unreadCount = useQuery(api.messages.unreadCountForThread, {
    jobId,
    peerId: q.supplierId,
  });
  const unread = unreadCount ?? 0;

  const statusText =
    q.status === "pending"
      ? "Awaiting quote"
      : q.status === "quoted"
        ? "Received"
        : q.status === "accepted"
          ? "Accepted"
          : q.status === "rejected"
            ? "Not selected"
            : q.status;

  return (
    <li className={`${ffCard} flex h-full flex-col`}>
      <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {q.supplierName ?? "Supplier"}
          </p>
          {q.supplierRating !== undefined && (
            <p className="mt-0.5 text-sm text-gray-600">
              ★ {q.supplierRating.toFixed(1)}
              {q.supplierReviewCount !== undefined
                ? ` · ${q.supplierReviewCount} reviews`
                : ""}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {statusText}
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
                <span className="font-medium text-gray-600">Note:</span> {q.notes}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm italic text-gray-500">
            Waiting for this supplier to send their quote…
          </p>
        )}
      </div>

      {jobOpen && q.status === "quoted" && q.isFinal === true && (
        <button
          type="button"
          onClick={onAccept}
          disabled={acceptingId !== null}
          className={`${ffBtnPrimary} ${ffBtnInRow} mt-auto pt-5`}
        >
          {acceptingId === q._id ? "Accepting…" : "Accept this quote"}
        </button>
      )}

      <button
        type="button"
        onClick={onToggleChat}
        className={`${ffBtnGhost} relative mt-3 self-start text-sm`}
        aria-expanded={chatOpen}
      >
        {chatOpen ? "Close chat" : "Message this tradesperson"}
        {!chatOpen && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {chatOpen && (
        <ChatPanel
          jobId={jobId}
          peerId={q.supplierId}
          peerLabel="Tradesperson"
        />
      )}
    </li>
  );
}
