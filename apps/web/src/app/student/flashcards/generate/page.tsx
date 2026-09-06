"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateFlashcards, listNotes, ApiError, type Note } from "@/lib/api";
import { Field, inputClass, buttonClass, ErrorText, Card } from "@/components/ui";

type Mode = "topic" | "note";

export default function GenerateFlashcardsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading...</p>}>
      <GenerateFlashcardsForm />
    </Suspense>
  );
}

function GenerateFlashcardsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetNoteId = searchParams.get("noteId");

  const [mode, setMode] = useState<Mode>(presetNoteId ? "note" : "topic");
  const [topic, setTopic] = useState("");
  const [noteId, setNoteId] = useState(presetNoteId ?? "");
  const [notes, setNotes] = useState<Note[]>([]);
  const [count, setCount] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (mode === "note" && notes.length === 0) {
      setLoadingNotes(true);
      listNotes()
        .then(setNotes)
        .catch(() => setError("Couldn't load your notes."))
        .finally(() => setLoadingNotes(false));
    }
  }, [mode, notes.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const set = await generateFlashcards(mode === "note" ? { noteId, count } : { topic: topic.trim(), count });
      router.push(`/student/flashcards/${set.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong generating flashcards.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = mode === "note" ? !!noteId : !!topic.trim();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Generate flashcards</h1>
      <p className="mt-1 text-sm text-ink-500">Create a flashcard set from a topic or one of your existing notes.</p>

      <Card className="mt-6">
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("topic")}
            className={buttonClass(mode === "topic" ? "primary" : "outline")}
          >
            New topic
          </button>
          <button
            type="button"
            onClick={() => setMode("note")}
            className={buttonClass(mode === "note" ? "primary" : "outline")}
          >
            From a note
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "topic" ? (
            <Field label="Topic" htmlFor="topic">
              <input
                id="topic"
                required
                maxLength={200}
                className={inputClass}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cell division"
              />
            </Field>
          ) : (
            <Field label="Note" htmlFor="noteId">
              <select
                id="noteId"
                required
                className={inputClass}
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
                disabled={loadingNotes}
              >
                <option value="">{loadingNotes ? "Loading notes..." : "Select a note"}</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.topic}
                  </option>
                ))}
              </select>
              {!loadingNotes && notes.length === 0 && (
                <p className="mt-1.5 text-xs text-ink-300">
                  You don&apos;t have any notes yet — generate some first, or switch to &quot;New topic&quot;.
                </p>
              )}
            </Field>
          )}

          <Field label="Number of cards" htmlFor="count">
            <select id="count" className={inputClass} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 8, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} cards
                </option>
              ))}
            </select>
          </Field>

          {error && <ErrorText>{error}</ErrorText>}

          <button type="submit" disabled={submitting || !canSubmit} className={buttonClass("primary", "w-full")}>
            {submitting ? "Generating..." : "Generate flashcards"}
          </button>
        </form>
      </Card>
    </div>
  );
}
