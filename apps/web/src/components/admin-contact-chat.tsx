"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  listMyAdminMessages,
  sendMyAdminMessage,
  ApiError,
  type BookingMessage,
} from "@/lib/api";
import { Card, buttonClass, ErrorText, inputClass } from "@/components/ui";

const ACCEPTED_ATTACHMENT_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

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
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AdminContactChat() {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    listMyAdminMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load messages"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !attachment) || sending) return;

    setSending(true);
    setError(null);
    try {
      const message = await sendMyAdminMessage(body, attachment ?? undefined);
      setMessages((prev) => [...prev, message]);
      setDraft("");
      setAttachment(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Message Lumen</h2>
      <p className="mt-1 text-sm text-ink-500">Get in touch directly with the Lumen team — a human, not the AI helper.</p>

      <div ref={scrollRef} className="mt-4 flex h-112 flex-col gap-2 overflow-y-auto rounded-xl border border-ink-700/10 bg-cream/50 p-3">
        {loading ? (
          <p className="text-sm text-ink-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-300">No messages yet — send one and we&apos;ll get back to you.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender.role !== "ADMIN";
            return (
              <div
                key={m.id}
                className={`max-w-[min(85%,42rem)] rounded-2xl px-3.5 py-2 text-sm ${
                  isMine ? "self-end bg-sky-600 text-white" : "self-start bg-white text-ink-700 shadow-sm"
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
                <div className={`mt-1 text-[11px] ${isMine ? "text-white/70" : "text-ink-300"}`}>
                  {m.sender.role === "ADMIN" ? "Lumen team" : "You"} · {formatTime(m.sentAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {attachment && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-700/10 bg-white px-3 py-2">
          <PaperclipIcon />
          <span className="min-w-0 flex-1 truncate text-xs text-ink-500">{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="shrink-0 text-ink-300 transition hover:text-ink-700">
            <XIcon />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
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
        <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className={buttonClass("primary", "shrink-0")}>
          Send
        </button>
      </form>
    </Card>
  );
}
