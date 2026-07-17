import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "../../lib/LanguageContext";

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
  const { language } = useLanguage();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-muted/50 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </header>

      {items === undefined && (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Loading…</p>
      )}

      {items !== undefined && items.length === 0 && (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{emptyLabel}</p>
      )}

      {items !== undefined && items.length > 0 && (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
          {items.map((n) => {
            const isMessage = n.type === "new_message";
            const canOpen = isMessage && n.jobId && onOpenJobChat;

            const nDyn = n as any;
            const displayMessage =
              language === "si" ? (nDyn.message_si || n.message) :
              language === "ta" ? (nDyn.message_ta || n.message) :
              (nDyn.message_en || n.message);

            const openChatLabel =
              language === "si" ? "සංවාදය විවෘත කරන්න →" :
              language === "ta" ? "உரையாடலைத் திறக்கவும் →" :
              "Open chat →";

            return (
              <li key={n._id}>
                {canOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpenJobChat(n.jobId!)}
                    className={`flex w-full flex-col gap-1 px-5 py-3.5 text-left transition hover:bg-accent sm:px-6 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <NotificationRow
                      message={displayMessage}
                      read={n.read}
                      isMessage={isMessage}
                      actionLabel={openChatLabel}
                    />
                  </button>
                ) : (
                  <div
                    className={`px-5 py-3.5 sm:px-6 ${!n.read ? "bg-muted/60" : ""}`}
                  >
                    <NotificationRow
                      message={displayMessage}
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
          className={`text-sm leading-snug ${
            read ? "text-muted-foreground" : "font-medium text-foreground"
          }`}
        >
          {message}
        </span>
      </span>
      {actionLabel && (
        <span className="pl-7 text-xs font-medium text-primary">{actionLabel}</span>
      )}
    </>
  );
}
