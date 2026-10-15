"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { listAiMessages, sendAiMessage, getMySubscription, ApiError, type AiMessage, type SubscriptionSummary } from "@/lib/api";
import { Card, inputClass, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";
import { formatResetIn } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx";

interface DisplayImageAttachment {
  kind: "IMAGE";
  name: string;
  mimeType: string;
  data?: string; // present once echoed back by the server
  previewUrl?: string; // present for the optimistic/pending bubble
}
interface DisplayDocumentAttachment {
  kind: "DOCUMENT";
  name: string;
  mimeType: string;
}
type DisplayAttachment = DisplayImageAttachment | DisplayDocumentAttachment;

// The optimistic bubble shown right after sending needs to preview the
// picked Files immediately (via local object URLs) — the server hasn't
// echoed back the persisted attachments yet at that point.
type ChatMessage = Omit<AiMessage, "attachments"> & { attachments: DisplayAttachment[] | null };

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function SparkleIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.4 4.3L18 8.7l-4.6 1.4L12 14.4l-1.4-4.3L6 8.7l4.6-1.4z" />
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

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 8.5a4.5 4.5 0 0 1 0 7" />
    </svg>
  );
}

function ThumbUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4.5-7a2 2 0 0 1 3.5 1.4V9h4.2a2 2 0 0 1 1.9 2.6l-2.1 7A2 2 0 0 1 17.1 20H7" />
    </svg>
  );
}

function ThumbDownIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3zm0 0-4.5 7a2 2 0 0 1-3.5-1.4V15H4.8a2 2 0 0 1-1.9-2.6l2.1-7A2 2 0 0 1 6.9 4H17" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
    </span>
  );
}

export function AiHelperChat() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const imagePreviewUrls = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  function loadSubscription() {
    getMySubscription()
      .then(setSubscription)
      .catch(() => {});
  }

  useEffect(() => {
    listAiMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load chat"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadSubscription, []);

  // Scroll only the chat's own message list, not the whole dashboard —
  // `scrollIntoView` walks every scrollable ancestor including the page
  // itself, which used to yank the entire dashboard down to this card on
  // every load.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // Let the draft box grow with the text instead of hiding it behind a
  // single-line, horizontally-scrolling input.
  useEffect(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const maxFiles = subscription?.maxFilesPerMessage ?? 1;
  const attachedCount = images.length + documents.length;
  const atFileLimit = attachedCount >= maxFiles;

  function handlePickImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = maxFiles - attachedCount;
    if (room <= 0) {
      setError(`Your plan allows up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} per message.`);
      return;
    }
    const accepted: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files can be attached.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("That image is too large — please attach one under 5MB.");
        continue;
      }
      if (accepted.length >= room) break;
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setError(null);
    setImages((prev) => [...prev, ...accepted]);
  }

  function handlePickDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = maxFiles - attachedCount;
    if (room <= 0) {
      setError(`Your plan allows up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} per message.`);
      return;
    }
    const accepted: File[] = [];
    for (const file of files) {
      const isPdf = file.type === "application/pdf";
      const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!isPdf && !isDocx) {
        setError("Only PDF or Word (.docx) documents can be attached.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("That file is too large — please attach one under 5MB.");
        continue;
      }
      if (accepted.length >= room) break;
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setError(null);
    setDocuments((prev) => [...prev, ...accepted]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if ((!content && images.length === 0 && documents.length === 0) || sending) return;

    const pendingImages = images;
    const pendingDocuments = documents;
    const pendingPreviewUrls = imagePreviewUrls;

    setError(null);
    setSending(true);
    setDraft("");
    setImages([]);
    setDocuments([]);

    const optimisticAttachments: DisplayAttachment[] = [
      ...pendingImages.map(
        (f, i): DisplayAttachment => ({ kind: "IMAGE", name: f.name, mimeType: f.type, previewUrl: pendingPreviewUrls[i] }),
      ),
      ...pendingDocuments.map((f): DisplayAttachment => ({ kind: "DOCUMENT", name: f.name, mimeType: f.type })),
    ];

    setMessages((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        role: "USER",
        content,
        attachments: optimisticAttachments.length > 0 ? optimisticAttachments : null,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const reply = await sendAiMessage(content, pendingImages, pendingDocuments);
      setMessages((prev) => [...prev, reply]);
      loadSubscription();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  function handleAttachImageClick() {
    if (subscription && !subscription.canUseVision) {
      setError("Attaching photos is available on the Plus and Pro plans.");
      return;
    }
    if (atFileLimit) {
      setError(`Your plan allows up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} per message.`);
      return;
    }
    imageInputRef.current?.click();
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    });
  }

  function handleReadAloud(content: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(content));
  }

  function handleFeedback(id: string, vote: "up" | "down") {
    setFeedback((prev) => {
      const next = { ...prev };
      if (next[id] === vote) delete next[id];
      else next[id] = vote;
      return next;
    });
  }

  function handleAttachDocumentClick() {
    if (atFileLimit) {
      setError(`Your plan allows up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} per message.`);
      return;
    }
    documentInputRef.current?.click();
  }

  return (
    <Card>
      <div
        ref={scrollContainerRef}
        className="flex h-128 flex-col overflow-y-auto rounded-xl border border-ink-700/10 bg-cream/50 p-4 sm:h-144"
      >
        {loading ? (
          <p className="text-sm text-ink-500">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="text-gold-500">
              <SparkleIcon />
            </span>
            <p className="font-display text-xl font-semibold text-ink-900">
              What are you studying{firstName ? `, ${firstName}` : ""}?
            </p>
            <p className="max-w-xs text-sm text-ink-500">
              Ask a question, attach a photo of a problem, or drop in a document — I&apos;ll help you work
              through it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => {
              const attachmentsBlock = m.attachments && m.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {m.attachments.map((att, i) =>
                    att.kind === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={att.previewUrl ?? `data:${att.mimeType};base64,${att.data}`}
                        alt="Attached"
                        className="max-h-48 rounded-lg border border-white/20 object-contain"
                      />
                    ) : (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                          m.role === "USER" ? "border-white/25 text-white/90" : "border-ink-700/15 text-ink-500"
                        }`}
                      >
                        <PaperclipIcon />
                        {att.name}
                      </span>
                    ),
                  )}
                </div>
              );

              if (m.role === "USER") {
                return (
                  <div
                    key={m.id}
                    className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl bg-sky-600 px-4 py-2.5 text-sm text-white"
                  >
                    {attachmentsBlock}
                    {m.content}
                  </div>
                );
              }

              // AI replies: no bubble, a labeled avatar row instead — closer to
              // a normal document than a chat bubble, since answers are often
              // long/formatted (lists, bold terms, etc.) and read better full-width.
              return (
                <div key={m.id} className="max-w-[92%] self-start">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-300/40 text-gold-600">
                      <SparkleIcon size={12} />
                    </span>
                    Lumen AI
                  </div>
                  <div className="text-sm text-ink-700">
                    {attachmentsBlock}
                    {m.content && <MarkdownContent content={m.content} />}
                  </div>
                  {m.content && (
                    <div className="mt-1.5 flex items-center gap-1 text-ink-300">
                      <button
                        type="button"
                        onClick={() => handleReadAloud(m.content)}
                        aria-label="Read aloud"
                        title="Read aloud"
                        className="rounded-md p-1.5 transition hover:bg-ink-700/5 hover:text-ink-700"
                      >
                        <SpeakerIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        aria-label="Copy response"
                        title="Copy"
                        className="rounded-md p-1.5 transition hover:bg-ink-700/5 hover:text-ink-700"
                      >
                        {copiedId === m.id ? <CheckIcon /> : <CopyIcon />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(m.id, "up")}
                        aria-label="Good response"
                        title="Good response"
                        className={`rounded-md p-1.5 transition hover:bg-ink-700/5 ${feedback[m.id] === "up" ? "text-emerald-600" : "hover:text-ink-700"}`}
                      >
                        <ThumbUpIcon filled={feedback[m.id] === "up"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(m.id, "down")}
                        aria-label="Poor response"
                        title="Poor response"
                        className={`rounded-md p-1.5 transition hover:bg-ink-700/5 ${feedback[m.id] === "down" ? "text-red-600" : "hover:text-ink-700"}`}
                      >
                        <ThumbDownIcon filled={feedback[m.id] === "down"} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {sending && (
              <div className="self-start">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-300/40 text-gold-600">
                    <SparkleIcon size={12} />
                  </span>
                  Lumen AI
                </div>
                <ThinkingDots />
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {(images.length > 0 || documents.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((file, i) => (
            <div key={`img-${i}`} className="flex items-center gap-2 rounded-lg border border-ink-700/10 bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreviewUrls[i]} alt="Selected attachment" className="h-10 w-10 rounded object-cover" />
              <span className="max-w-[140px] truncate text-xs text-ink-500">{file.name}</span>
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove attached image"
                className="text-ink-300 transition hover:text-ink-700"
              >
                <XIcon />
              </button>
            </div>
          ))}
          {documents.map((file, i) => (
            <div key={`doc-${i}`} className="flex items-center gap-2 rounded-lg border border-ink-700/10 bg-white px-3 py-2">
              <PaperclipIcon />
              <span className="max-w-[140px] truncate text-xs text-ink-500">{file.name}</span>
              <button
                type="button"
                onClick={() => removeDocument(i)}
                aria-label="Remove attached document"
                className="text-ink-300 transition hover:text-ink-700"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {subscription && (
        <p className="mt-3 text-xs text-ink-300">
          {subscription.aiMessagesLimit !== null ? (
            <>
              {subscription.aiMessagesUsed} / {subscription.aiMessagesLimit} messages
              {subscription.plan === "FREE"
                ? subscription.aiMessagesResetAt
                  ? ` · resets in ${formatResetIn(subscription.aiMessagesResetAt)}`
                  : ""
                : " this month"}{" "}
              on the {subscription.plan} plan ·{" "}
            </>
          ) : null}
          Up to {subscription.maxFilesPerMessage} file{subscription.maxFilesPerMessage === 1 ? "" : "s"} per message ·{" "}
          <Link href="/student/subscription" className="font-semibold text-sky-700 hover:text-sky-600">
            Upgrade
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2 sm:flex-nowrap sm:gap-3">
        <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handlePickImages} className="hidden" />
        <input
          ref={documentInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_TYPES}
          multiple
          onChange={handlePickDocuments}
          className="hidden"
        />
        {/* Full-width on its own row on mobile (so the draft is actually
            visible while typing) via order-1 + w-full forcing everything
            else to wrap below it; back to inline with the buttons at sm.
            A textarea (not input) so it grows with the text instead of
            scrolling it off sideways; Enter sends, Shift+Enter adds a line. */}
        <textarea
          ref={draftRef}
          rows={1}
          className={`${inputClass} order-1 w-full min-w-0 resize-none overflow-y-auto sm:order-2 sm:w-auto sm:flex-1`}
          placeholder="Ask a question..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          disabled={sending}
        />
        <button
          type="button"
          onClick={handleAttachImageClick}
          disabled={sending}
          aria-label="Attach a photo"
          title="Attach a photo"
          className="order-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-700/15 bg-white text-ink-500 transition hover:border-sky-400/50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          onClick={handleAttachDocumentClick}
          disabled={sending}
          aria-label="Attach a document"
          title="Attach a PDF or Word document"
          className="order-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-700/15 bg-white text-ink-500 transition hover:border-sky-400/50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
        >
          <PaperclipIcon />
        </button>
        <button
          type="submit"
          disabled={sending || (!draft.trim() && images.length === 0 && documents.length === 0)}
          className={buttonClass("primary", "order-4 ml-auto shrink-0 sm:order-3 sm:ml-0")}
        >
          Send
        </button>
      </form>
    </Card>
  );
}
