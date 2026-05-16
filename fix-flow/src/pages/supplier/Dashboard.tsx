import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { IncomingQuoteCard } from "../../components/supplier/IncomingQuoteCard";
import {
  ffCard,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { supplierUi } from "../../lib/supplierDashboardUi";

/** Supplier dashboard chrome stays English; job summaries use per-card language tabs. */
const t = supplierUi("en");

export default function SupplierDashboard() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const quoteRequests = useQuery(api.quoteRequests.listForSupplier);

  return (
    <div className={ffPage}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0">
          <h1 className={ffScreenTitle}>{t.dashboardTitle}</h1>
          <p className={ffScreenSubtitle}>{t.dashboardSubtitle}</p>
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
        {t.incomingRequests}
      </h2>

      {quoteRequests === undefined && (
        <p className="text-sm text-gray-500">{t.loading}</p>
      )}

      {quoteRequests !== undefined && quoteRequests.length === 0 && (
        <div className={`${ffCard} text-sm text-gray-600`}>
          <p className="font-medium text-gray-900">{t.emptyTitle}</p>
          <p className="mt-2 leading-relaxed">{t.emptyBody}</p>
        </div>
      )}

      {quoteRequests !== undefined && quoteRequests.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3 xl:gap-6">
          {quoteRequests.map((request) => (
            <IncomingQuoteCard key={request._id} request={request} />
          ))}
        </ul>
      )}
    </div>
  );
}