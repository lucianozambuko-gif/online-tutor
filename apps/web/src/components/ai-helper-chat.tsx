"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { listAiMessages, sendAiMessage, ApiError, type AiMessage } from "@/lib/api";
import { Card, inputClass, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The optimistic bubble shown right after sending needs to preview the
// picked File immediately (via a local object URL) — the server hasn't
// echoed back the persisted base64 imageData yet at that point.
type ChatMessage = AiMessage & { previewUrl?: string | null };

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
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

export function AiHelperChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const imagePreviewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAiMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load chat"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handlePickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files can be attached.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is too large — please attach one under 5MB.");
      return;
    }
    setError(null);
    setImage(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if ((!content && !image) || sending) return;

    const pendingImage = image;
    const pendingPreviewUrl = imagePreviewUrl;

    setError(null);
    setSending(true);
    setDraft("");
    setImage(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        role: "USER",
        content,
        imageData: null,
        imageMimeType: pendingImage?.type ?? null,
        createdAt: new Date().toISOString(),
        previewUrl: pendingPreviewUrl,
      },
    ]);

    try {
      const reply = await sendAiMessage(content, pendingImage ?? undefined);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Study helper</h2>
      <p className="mt-1 text-sm text-ink-500">
        Ask about anything you&apos;re studying, or attach a photo of a problem — it&apos;ll help you work through
        it, not just hand you the answer.
      </p>

      <div className="mt-5 flex h-96 flex-col overflow-y-auto rounded-xl border border-ink-700/10 bg-cream/50 p-4">
        {loading ? (
          <p className="text-sm text-ink-500">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-300">Ask your first question below to get started.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const imageSrc = m.previewUrl ?? (m.imageData ? `data:${m.imageMimeType};base64,${m.imageData}` : null);
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "USER"
                      ? "self-end whitespace-pre-wrap bg-sky-600 text-white"
                      : "self-start bg-white text-ink-700 shadow-sm"
                  }`}
                >
                  {imageSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt="Attached" className="mb-2 max-h-48 rounded-lg border border-white/20 object-contain" />
                  )}
                  {m.content && (m.role === "USER" ? m.content : <MarkdownContent content={m.content} />)}
                </div>
              );
            })}
            {sending && (
              <div className="self-start rounded-2xl bg-white px-4 py-2.5 text-sm text-ink-300 shadow-sm">
                Thinking...
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {imagePreviewUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-700/10 bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreviewUrl} alt="Selected attachment" className="h-10 w-10 rounded object-cover" />
          <span className="flex-1 truncate text-xs text-ink-500">{image?.name}</span>
          <button
            type="button"
            onClick={() => setImage(null)}
            aria-label="Remove attached image"
            className="text-ink-300 transition hover:text-ink-700"
          >
            <XIcon />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Attach an image"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-700/15 bg-white text-ink-500 transition hover:border-sky-400/50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon />
        </button>
        <input
          className={inputClass}
          placeholder="Ask a question..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || (!draft.trim() && !image)} className={buttonClass("primary")}>
          Send
        </button>
      </form>
    </Card>
  );
}
