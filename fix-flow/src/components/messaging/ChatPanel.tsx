import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ffBtnPrimary, ffInput } from "../../lib/fixflowUi";

/**
 * Per-job chat between the current user and a single peer.
 *
 * Identity is masked to role labels (e.g. "Homeowner" / "Tradesperson") — no real
 * names are shown, even though `messages.list` exposes `senderName`.
 *
 * Reads: `api.messages.list({ jobId })` (existing reactive query).
 * Writes: `api.messages.send({ jobId, receiverId, content })`.
 */
type ChatPanelProps = {
  jobId: Id<"jobs">;
  peerId: Id<"users">;
  /** How the *other* person should be labelled in the thread (no real names). */
  peerLabel: string;
  /** Optional own label; defaults to "You". */
  selfLabel?: string;
};

export function ChatPanel({
  jobId,
  peerId,
  peerLabel,
  selfLabel = "You",
}: ChatPanelProps) {
  const me = useQuery(api.users.getUser);
  const allMessages = useQuery(api.messages.list, { jobId });
  const sendMessage = useMutation(api.messages.send);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const myId = me?._id;

  const thread = useMemo(() => {
    if (!allMessages || !myId) return [];
    return allMessages.filter(
      (m) =>
        (m.senderId === myId && m.receiverId === peerId) ||
        (m.senderId === peerId && m.receiverId === myId),
    );
  }, [allMessages, myId, peerId]);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setError("");
    setSending(true);
    try {
      await sendMessage({ jobId, receiverId: peerId, content });
      setDraft("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  const loading = allMessages === undefined || me === undefined;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          Chat with {peerLabel}
        </p>
        <p className="text-xs text-gray-500">
          Identities are masked — no names or numbers shared.
        </p>
      </header>

      <div
        className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl bg-white p-3 ring-1 ring-gray-100 sm:max-h-80"
        role="log"
        aria-live="polite"
      >
        {loading && (
          <p className="text-sm text-gray-500">Loading messages…</p>
        )}

        {!loading && thread.length === 0 && (
          <p className="text-sm text-gray-500">
            No messages yet. Say hello to {peerLabel.toLowerCase()}.
          </p>
        )}

        {!loading &&
          thread.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div
                key={m._id}
                className={
                  mine
                    ? "flex flex-col items-end"
                    : "flex flex-col items-start"
                }
              >
                <span
                  className={
                    mine
                      ? "rounded-2xl rounded-br-sm bg-gray-900 px-3 py-2 text-sm text-white"
                      : "rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200"
                  }
                >
                  {m.content}
                </span>
                <span className="mt-1 text-[11px] text-gray-400">
                  {mine ? selfLabel : peerLabel} ·{" "}
                  {formatRelative(m._creationTime)}
                </span>
              </div>
            );
          })}

        <div ref={endRef} />
      </div>

      {error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSend}
        className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
      >
        <label htmlFor={`chat-${jobId}-${peerId}`} className="sr-only">
          Message {peerLabel}
        </label>
        <input
          id={`chat-${jobId}-${peerId}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${peerLabel.toLowerCase()}…`}
          maxLength={500}
          className={`${ffInput} flex-1`}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className={`${ffBtnPrimary} sm:max-w-[10rem]`}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const sec = Math.round(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}
