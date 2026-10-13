"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  listBookingMessages,
  sendBookingMessage,
  flagMessage,
  ApiError,
  type BookingMessage,
} from "@/lib/api";
import { buttonClass, ErrorText, inputClass } from "@/components/ui";

function FlagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22V4" />
    </svg>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BookingMessages({ bookingId, currentUserId }: { bookingId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  function load() {
    listBookingMessages(bookingId)
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load messages"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [bookingId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    try {
      const message = await sendBookingMessage(bookingId, body);
      setMessages((prev) => [...prev, message]);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleFlag(messageId: string) {
    setFlaggedIds((prev) => new Set(prev).add(messageId));
    try {
      await flagMessage(messageId);
    } catch {
      // Not worth surfacing an error for this — the button already shows
      // "Reported" optimistically, and a failed flag isn't user-actionable.
    }
  }

  return (
    <div className="rounded-xl border border-ink-700/10 bg-cream/50 p-3">
      <div ref={scrollRef} className="flex h-64 flex-col gap-2 overflow-y-auto p-1">
        {loading ? (
          <p className="text-sm text-ink-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-300">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender.id === currentUserId;
            const alreadyFlagged = m.flagged || flaggedIds.has(m.id);
            return (
              <div key={m.id} className={`group max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${isMine ? "self-end bg-sky-600 text-white" : "self-start bg-white text-ink-700 shadow-sm"}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <div className={`mt-1 flex items-center gap-2 text-[11px] ${isMine ? "text-white/70" : "text-ink-300"}`}>
                  <span>{formatTime(m.sentAt)}</span>
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => handleFlag(m.id)}
                      disabled={alreadyFlagged}
                      title="Report this message"
                      className="inline-flex items-center gap-1 opacity-0 transition hover:text-red-600 group-hover:opacity-100 disabled:opacity-60"
                    >
                      <FlagIcon />
                      {alreadyFlagged ? "Reported" : "Report"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mt-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          className={`${inputClass} min-w-0`}
          placeholder="Write a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !draft.trim()} className={buttonClass("primary", "shrink-0")}>
          Send
        </button>
      </form>
    </div>
  );
}
