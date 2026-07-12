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

type QuoteRow = {
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
  distanceKm?: number;
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

  const chatPeer = (quotes ?? []).find((q) => q.supplierId === chatOpenFor);

  return (
    <div>
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
            Compare offers in one table. Distance is from your job pin. Accept
            when ready — chat if you need to negotiate.
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

      {quotes !== undefined && quotes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Distance</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Offer</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <QuoteTableRow
                    key={q._id}
                    jobId={jobId}
                    quote={q}
                    jobOpen={jobOpen}
                    chatOpen={chatOpenFor === q.supplierId}
                    acceptingId={acceptingId}
                    onAccept={() => void handleAccept(q._id)}
                    onToggleChat={() =>
                      setChatOpenFor((current) =>
                        current === q.supplierId ? null : q.supplierId,
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          {chatPeer && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">
                  Chat with {chatPeer.supplierName ?? "tradesperson"}
                </p>
                <button
                  type="button"
                  onClick={() => setChatOpenFor(null)}
                  className={`${ffBtnGhost} w-auto text-sm`}
                >
                  Close
                </button>
              </div>
              <ChatPanel
                jobId={jobId}
                peerId={chatPeer.supplierId}
                peerLabel="Tradesperson"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteTableRow({
  jobId,
  quote: q,
  jobOpen,
  chatOpen,
  acceptingId,
  onAccept,
  onToggleChat,
}: {
  jobId: Id<"jobs">;
  quote: QuoteRow;
  jobOpen: boolean;
  chatOpen: boolean;
  acceptingId: Id<"quoteRequests"> | null;
  onAccept: () => void;
  onToggleChat: () => void;
}) {
  const unreadCount = useQuery(api.messages.unreadCountForThread, {
    jobId,
    peerId: q.supplierId,
  });
  const unread = unreadCount ?? 0;
  const canAccept = jobOpen && q.status === "quoted";
  const hasQuote = q.status === "quoted" || q.status === "accepted";

  return (
    <tr className={`border-t border-gray-100 ${chatOpen ? "bg-sky-50/60" : ""}`}>
      <td className="px-4 py-3 align-top">
        <p className="font-medium text-gray-900">
          {q.supplierName ?? "Supplier"}
          {q.status === "accepted" && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
              Hired
            </span>
          )}
          {q.status === "rejected" && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
              Not selected
            </span>
          )}
          {q.status === "pending" && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
              Awaiting
            </span>
          )}
        </p>
        {q.notes && hasQuote && (
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
            {q.notes}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top tabular-nums text-gray-700">
        {q.distanceKm !== undefined ? `${q.distanceKm.toFixed(1)} km` : "—"}
      </td>
      <td className="px-4 py-3 align-top tabular-nums text-gray-900">
        {hasQuote && q.priceLKR !== undefined
          ? `LKR ${q.priceLKR.toLocaleString("en-LK")}`
          : "—"}
      </td>
      <td className="px-4 py-3 align-top text-gray-700">
        {hasQuote ? (q.duration ?? "—") : "—"}
      </td>
      <td className="px-4 py-3 align-top text-gray-700">
        {q.supplierRating !== undefined
          ? `★ ${q.supplierRating.toFixed(1)}`
          : "—"}
        {q.supplierReviewCount !== undefined
          ? ` (${q.supplierReviewCount})`
          : ""}
      </td>
      <td className="px-4 py-3 align-top">
        {q.status === "quoted" || q.status === "accepted" ? (
          q.isFinal ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
              Final
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Negotiable
            </span>
          )
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {canAccept && (
            <button
              type="button"
              onClick={onAccept}
              disabled={acceptingId !== null}
              className={`${ffBtnPrimary} ${ffBtnInRow} min-h-[40px] w-auto px-3 py-2 text-xs`}
            >
              {acceptingId === q._id ? "Accepting…" : "Accept"}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleChat}
            className={`${ffBtnGhost} relative w-auto min-h-[40px] px-2 py-1.5 text-xs`}
            aria-expanded={chatOpen}
          >
            {chatOpen ? "Hide chat" : "Message"}
            {!chatOpen && unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
