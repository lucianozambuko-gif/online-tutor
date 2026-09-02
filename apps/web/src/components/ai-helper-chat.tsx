"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { listAiMessages, sendAiMessage, ApiError, type AiMessage } from "@/lib/api";
import { Card, inputClass, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";

export function AiHelperChat() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listAiMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load chat"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setError(null);
    setSending(true);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: `pending-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() },
    ]);

    try {
      const reply = await sendAiMessage(content);
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
        Ask about anything you're studying — it'll help you work through it, not just hand you the
        answer.
      </p>

      <div className="mt-5 flex h-96 flex-col overflow-y-auto rounded-xl border border-ink-700/10 bg-cream/50 p-4">
        {loading ? (
          <p className="text-sm text-ink-500">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-300">Ask your first question below to get started.</p>
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
                {m.role === "USER" ? m.content : <MarkdownContent content={m.content} />}
              </div>
            ))}
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

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          className={inputClass}
          placeholder="Ask a question..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !draft.trim()} className={buttonClass("primary")}>
          Send
        </button>
      </form>
    </Card>
  );
}
