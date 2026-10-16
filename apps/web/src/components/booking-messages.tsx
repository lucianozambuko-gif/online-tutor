"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  listBookingMessages,
  sendBookingMessage,
  markBookingMessagesRead,
  flagMessage,
  ApiError,
  type BookingMessage,
} from "@/lib/api";
import { buttonClass, ErrorText } from "@/components/ui";

const ACCEPTED_ATTACHMENT_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22V4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

// Groups consecutive messages under one date separator, so the thread reads
// like "Today / msg / msg — Yesterday / msg" instead of a flat list.
function groupByDay(messages: BookingMessage[]) {
  const groups: { label: string; messages: BookingMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(m.sentAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else groups.push({ label, messages: [m] });
  }
  return groups;
}

export function BookingMessages({ bookingId, currentUserId }: { bookingId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    listBookingMessages(bookingId)
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load messages"))
      .finally(() => setLoading(false));
  }

  // Opening this panel at all counts as reading it — clears the unread
  // badge on the "Messages" button this lives under.
  useEffect(() => {
    load();
    markBookingMessagesRead(bookingId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

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

  function handleCopy(messageId: string, body: string) {
    navigator.clipboard
      .writeText(body)
      .then(() => {
        setCopiedId(messageId);
        setTimeout(() => setCopiedId((id) => (id === messageId ? null : id)), 1500);
      })
      .catch(() => {});
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
      <div ref={scrollRef} className="flex h-96 flex-col gap-3 overflow-y-auto p-1 sm:h-80">
        {loading ? (
          <p className="text-sm text-ink-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-300">No messages yet — say hello.</p>
        ) : (
          groupByDay(messages).map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-ink-700/8 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
                  {group.label}
                </span>
              </div>
              {group.messages.map((m) => {
                const isMine = m.sender.id === currentUserId;
                const alreadyFlagged = m.flagged || flaggedIds.has(m.id);
                return (
                  <div key={m.id} className={`group flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                      {!isMine && (
                        <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                          {initials(m.sender.name)}
                        </span>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMine ? "bg-sky-600 text-white" : "bg-white text-ink-700 shadow-sm"
                        }`}
                      >
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
                        <span className={`mt-1 block text-[11px] ${isMine ? "text-white/70" : "text-ink-300"}`}>
                          {formatTime(m.sentAt)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 text-ink-300 opacity-0 transition group-hover:opacity-100 ${
                        isMine ? "pr-1" : "pl-9"
                      }`}
                    >
                      {m.body && (
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.body!)}
                          aria-label="Copy message"
                          title="Copy"
                          className="rounded-md p-1.5 transition hover:bg-ink-700/5 hover:text-ink-700"
                        >
                          {copiedId === m.id ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      )}
                      {!isMine && (
                        <button
                          type="button"
                          onClick={() => handleFlag(m.id)}
                          disabled={alreadyFlagged}
                          aria-label="Report this message"
                          title={alreadyFlagged ? "Reported" : "Report"}
                          className={`rounded-md p-1.5 transition hover:bg-ink-700/5 disabled:opacity-60 ${
                            alreadyFlagged ? "text-red-600" : "hover:text-red-600"
                          }`}
                        >
                          <FlagIcon />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
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
          // 16px (text-base), not inputClass's text-sm — a sub-16px font on
          // an input makes iOS Safari auto-zoom the whole page on focus,
          // which is what made this feel "too small to see" on mobile.
          className="min-w-0 w-full rounded-lg border border-ink-700/15 bg-white px-3.5 py-2.5 text-base text-ink-900 shadow-sm outline-none transition placeholder:text-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
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
