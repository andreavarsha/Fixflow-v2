import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type NotificationFeedProps = {
  title: string;
  hint: string;
  emptyLabel: string;
  /** When set, message notifications open chat for that job. */
  onOpenJobChat?: (jobId: Id<"jobs">) => void;
};

export function NotificationFeed({
  title,
  hint,
  emptyLabel,
  onOpenJobChat,
}: NotificationFeedProps) {
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const items = useQuery(api.notifications.listRecent, { limit: 12 });

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 bg-gray-50/90 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      </header>

      {items === undefined && (
        <p className="px-5 py-6 text-sm text-gray-500 sm:px-6">Loading…</p>
      )}

      {items !== undefined && items.length === 0 && (
        <p className="px-5 py-6 text-sm text-gray-600 sm:px-6">{emptyLabel}</p>
      )}

      {items !== undefined && items.length > 0 && (
        <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
          {items.map((n) => {
            const isMessage = n.type === "new_message";
            const canOpen = isMessage && n.jobId && onOpenJobChat;

            return (
              <li key={n._id}>
                {canOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpenJobChat(n.jobId!)}
                    className={`flex w-full flex-col gap-1 px-5 py-3.5 text-left transition hover:bg-gray-50 sm:px-6 ${
                      !n.read ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <NotificationRow
                      message={n.message}
                      read={n.read}
                      isMessage={isMessage}
                      actionLabel="Open chat →"
                    />
                  </button>
                ) : (
                  <div
                    className={`px-5 py-3.5 sm:px-6 ${!n.read ? "bg-gray-50/80" : ""}`}
                  >
                    <NotificationRow
                      message={n.message}
                      read={n.read}
                      isMessage={isMessage}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NotificationRow({
  message,
  read,
  isMessage,
  actionLabel,
}: {
  message: string;
  read: boolean;
  isMessage: boolean;
  actionLabel?: string;
}) {
  return (
    <>
      <span className="flex items-start gap-2">
        <span className="text-base leading-none" aria-hidden>
          {isMessage ? "💬" : "🔔"}
        </span>
        <span
          className={`text-sm leading-snug ${read ? "text-gray-600" : "font-medium text-gray-900"}`}
        >
          {message}
        </span>
      </span>
      {actionLabel && (
        <span className="pl-7 text-xs font-medium text-blue-700">{actionLabel}</span>
      )}
    </>
  );
}
