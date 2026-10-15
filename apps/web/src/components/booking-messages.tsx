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

const ACCEPTED_ATTACHMENT_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function FlagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22V4" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9.5 12.5 18a4 4 0 0 1-5.7-5.7L15 4a2.7 2.7 0 0 1 3.8 3.8L10 16.5a1.3 1.3 0 0 1-1.9-1.8L15.5 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6z" />
      <path d="M15 2v3h3" />
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!body && !attachment) || sending) return;

    setSending(true);
    setError(null);
    try {
      const message = await sendBookingMessage(bookingId, body, attachment ?? undefined);
      setMessages((prev) => [...prev, message]);
      setDraft("");
      setAttachment(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  function handlePickAttachment(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("That file is too large — please attach one under 5MB.");
      return;
    }
    setError(null);
    setAttachment(file);
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
                {m.attachmentData &&
                  (m.attachmentMimeType?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:${m.attachmentMimeType};base64,${m.attachmentData}`}
                      alt={m.attachmentName ?? "Attachment"}
                      className="mb-1.5 max-h-48 rounded-lg border border-white/20 object-contain"
                    />
                  ) : (
                    <a
                      href={`data:${m.attachmentMimeType};base64,${m.attachmentData}`}
                      download={m.attachmentName ?? undefined}
                      className={`mb-1.5 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                        isMine ? "border-white/25 text-white/90 hover:text-white" : "border-ink-700/15 text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      <DocumentIcon />
                      <span className="truncate">{m.attachmentName ?? "Attachment"}</span>
                    </a>
                  ))}
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
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

      {attachment && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-ink-700/10 bg-white px-3 py-2">
          <PaperclipIcon />
          <span className="min-w-0 flex-1 truncate text-xs text-ink-500">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Remove attachment"
            className="shrink-0 text-ink-300 transition hover:text-ink-700"
          >
            <XIcon />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input ref={fileInputRef} type="file" accept={ACCEPTED_ATTACHMENT_TYPES} onChange={handlePickAttachment} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Attach a file"
          title="Attach a photo or PDF"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-700/15 bg-white text-ink-500 transition hover:border-sky-400/50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperclipIcon />
        </button>
        <input
          className={`${inputClass} min-w-0`}
          placeholder="Write a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || (!draft.trim() && !attachment)}
          className={buttonClass("primary", "shrink-0")}
        >
          Send
        </button>
      </form>
    </div>
  );
}
