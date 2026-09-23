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

function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.4 4.3L18 8.7l-4.6 1.4L12 14.4l-1.4-4.3L6 8.7l4.6-1.4z" />
    </svg>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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
        className="flex h-96 flex-col overflow-y-auto rounded-xl border border-ink-700/10 bg-cream/50 p-4"
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
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "USER"
                    ? "self-end whitespace-pre-wrap bg-sky-600 text-white"
                    : "self-start bg-white text-ink-700 shadow-sm"
                }`}
              >
                {m.attachments && m.attachments.length > 0 && (
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
                )}
                {m.content && (m.role === "USER" ? m.content : <MarkdownContent content={m.content} />)}
              </div>
            ))}
            {sending && (
              <div className="self-start rounded-2xl bg-white px-4 py-2.5 text-sm text-ink-300 shadow-sm">
                Thinking...
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

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap sm:gap-3">
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
            else to wrap below it; back to inline with the buttons at sm. */}
        <input
          className={`${inputClass} order-1 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1`}
          placeholder="Ask a question..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
