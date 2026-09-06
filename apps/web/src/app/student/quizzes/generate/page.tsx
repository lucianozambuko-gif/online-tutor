"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateQuiz, listNotes, ApiError, type Note } from "@/lib/api";
import { Field, inputClass, buttonClass, ErrorText, Card } from "@/components/ui";

type Mode = "topic" | "note";
type Difficulty = "easy" | "medium" | "hard";

export default function GenerateQuizPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading...</p>}>
      <GenerateQuizForm />
    </Suspense>
  );
}

function GenerateQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetNoteId = searchParams.get("noteId");

  const [mode, setMode] = useState<Mode>(presetNoteId ? "note" : "topic");
  const [topic, setTopic] = useState("");
  const [noteId, setNoteId] = useState(presetNoteId ?? "");
  const [notes, setNotes] = useState<Note[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);
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
      const quiz = await generateQuiz(
        mode === "note" ? { noteId, difficulty, count } : { topic: topic.trim(), difficulty, count },
      );
      router.push(`/student/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong generating your quiz.");
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
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Generate a quiz</h1>
      <p className="mt-1 text-sm text-ink-500">Practice with multiple-choice questions on a topic or note.</p>

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
                placeholder="e.g. The Cold War"
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

          <Field label="Difficulty" htmlFor="difficulty">
            <select
              id="difficulty"
              className={inputClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>

          <Field label="Number of questions" htmlFor="count">
            <select id="count" className={inputClass} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </Field>

          {error && <ErrorText>{error}</ErrorText>}

          <button type="submit" disabled={submitting || !canSubmit} className={buttonClass("primary", "w-full")}>
            {submitting ? "Generating..." : "Generate quiz"}
          </button>
        </form>
      </Card>
    </div>
  );
}
