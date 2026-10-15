"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminListConversations,
  adminStartConversation,
  adminListMessages,
  adminSendMessage,
  ApiError,
  type AdminConversation,
  type BookingMessage,
} from "@/lib/api";
import { buttonClass, ErrorText, inputClass } from "@/components/ui";

const ACCEPTED_ATTACHMENT_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9.5 12.5 18a4 4 0 0 1-5.7-5.7L15 4a2.7 2.7 0 0 1 3.8 3.8L10 16.5a1.3 1.3 0 0 1-1.9-1.8L15.5 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6z" />
      <path d="M15 2v3h3" />
    </svg>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// `startWithUserId` lets a parent (e.g. the "Message" button on the admin
// users table) ask this panel to open — creating if needed — a direct
// conversation with a specific user. `onStarted` clears that request once
// handled so clicking the same user again still re-triggers it.
export function AdminMessagesPanel({
  startWithUserId,
  onStarted,
}: {
  startWithUserId?: string | null;
  onStarted?: () => void;
}) {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    adminListConversations()
      .then(setConversations)
      .catch((err) => setConversationsError(err instanceof ApiError ? err.message : "Failed to load conversations"))
      .finally(() => setConversationsLoading(false));
  }

  useEffect(loadConversations, []);

  function openConversation(id: string) {
    setSelectedId(id);
    setMessagesLoading(true);
    setError(null);
    adminListMessages(id)
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load messages"))
      .finally(() => setMessagesLoading(false));
  }

  useEffect(() => {
    if (!startWithUserId) return;
    adminStartConversation(startWithUserId)
      .then((conv) => {
        openConversation(conv.id);
        loadConversations();
      })
      .catch((err) => setConversationsError(err instanceof ApiError ? err.message : "Failed to start conversation"))
      .finally(() => onStarted?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWithUserId]);

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
    if (!selectedId) return;
    const body = draft.trim();
    if ((!body && !attachment) || sending) return;

    setSending(true);
    setError(null);
    try {
      const message = await adminSendMessage(selectedId, body, attachment ?? undefined);
      setMessages((prev) => [...prev, message]);
      setDraft("");
      setAttachment(null);
      loadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-full shrink-0 sm:w-56">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">Conversations</p>
        {conversationsError && <ErrorText>{conversationsError}</ErrorText>}
        {conversationsLoading ? (
          <p className="text-sm text-ink-500">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-ink-300">No conversations yet.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    selectedId === c.id ? "bg-sky-100 font-semibold text-sky-700" : "text-ink-700 hover:bg-ink-700/5"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700/8 text-xs font-semibold text-ink-700">
                    {initials(c.otherParticipant.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{c.otherParticipant.name}</span>
                    <span className="block truncate text-xs font-normal text-ink-300">
                      {c.lastMessage?.body ?? (c.lastMessage?.attachmentName ? `📎 ${c.lastMessage.attachmentName}` : "No messages yet")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-ink-700/10 bg-cream/50 p-3">
        {!selectedId ? (
          <p className="flex h-64 items-center justify-center text-sm text-ink-300">
            Select a conversation, or click &ldquo;Message&rdquo; next to a user below.
          </p>
        ) : (
          <>
            {selectedConversation && (
              <p className="mb-2 text-xs font-semibold text-ink-500">
                {selectedConversation.otherParticipant.name} ({selectedConversation.otherParticipant.role.toLowerCase()})
              </p>
            )}
            <div ref={scrollRef} className="flex h-56 flex-col gap-2 overflow-y-auto p-1">
              {messagesLoading ? (
                <p className="text-sm text-ink-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-ink-300">No messages yet — say hello.</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender.role === "ADMIN";
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
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
                      <div className={`mt-1 text-[11px] ${isMine ? "text-white/70" : "text-ink-300"}`}>{formatTime(m.sentAt)}</div>
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
                <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="shrink-0 text-ink-300 transition hover:text-ink-700">
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
              <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className={buttonClass("primary", "shrink-0")}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
