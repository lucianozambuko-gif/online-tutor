"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  listNotes,
  listFlashcardSets,
  listQuizzes,
  ApiError,
  type Note,
  type FlashcardSetSummary,
  type QuizSummary,
} from "@/lib/api";
import { Card, inputClass, buttonClass, ErrorText } from "@/components/ui";

type Tab = "all" | "notes" | "flashcards" | "quizzes";

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading...</p>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const presetTab = searchParams.get("tab") as Tab | null;

  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetSummary[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>(presetTab ?? "all");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    Promise.all([listNotes(), listFlashcardSets(), listQuizzes()])
      .then(([n, f, q]) => {
        setNotes(n);
        setFlashcardSets(f);
        setQuizzes(q);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your library right now."))
      .finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(notes.map((n) => n.subject).filter((s): s is string => !!s))).sort(),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      const matchesSearch = !q || n.topic.toLowerCase().includes(q) || (n.subject ?? "").toLowerCase().includes(q);
      const matchesSubject = !subject || n.subject === subject;
      return matchesSearch && matchesSubject;
    });
  }, [notes, search, subject]);

  const filteredFlashcards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (subject) return [];
    return flashcardSets.filter((f) => !q || f.topic.toLowerCase().includes(q));
  }, [flashcardSets, search, subject]);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (subject) return [];
    return quizzes.filter((qz) => !q || qz.topic.toLowerCase().includes(q));
  }, [quizzes, search, subject]);

  const showNotes = tab === "all" || tab === "notes";
  const showFlashcards = tab === "all" || tab === "flashcards";
  const showQuizzes = tab === "all" || tab === "quizzes";
  const totalResults =
    (showNotes ? filteredNotes.length : 0) +
    (showFlashcards ? filteredFlashcards.length : 0) +
    (showQuizzes ? filteredQuizzes.length : 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Library</h1>
          <p className="mt-1 text-sm text-ink-500">All your notes, flashcards, and quizzes in one place.</p>
        </div>
        {tab === "all" ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/student/notes/generate" className={buttonClass("outline")}>
              New note
            </Link>
            <Link href="/student/flashcards/generate" className={buttonClass("outline")}>
              New flashcards
            </Link>
            <Link href="/student/quizzes/generate" className={buttonClass("primary")}>
              New quiz
            </Link>
          </div>
        ) : (
          <Link
            href={
              tab === "notes"
                ? "/student/notes/generate"
                : tab === "flashcards"
                  ? "/student/flashcards/generate"
                  : "/student/quizzes/generate"
            }
            className={buttonClass("primary")}
          >
            {tab === "notes" ? "New note" : tab === "flashcards" ? "New flashcards" : "New quiz"}
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "notes", "flashcards", "quizzes"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={buttonClass(tab === t ? "primary" : "outline")}>
            {t === "all" ? "All" : t === "notes" ? "Notes" : t === "flashcards" ? "Flashcards" : "Quizzes"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={`${inputClass} flex-1`}
          placeholder="Search by topic or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tab !== "flashcards" && tab !== "quizzes" && subjects.length > 0 && (
          <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-ink-500">Loading your library...</p>}
        {error && <ErrorText>{error}</ErrorText>}

        {!loading && !error && totalResults === 0 && <p className="text-sm text-ink-300">Nothing matches your search yet.</p>}

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2">
            {showNotes &&
              filteredNotes.map((note) => (
                <Link key={note.id} href={`/student/notes/${note.id}`}>
                  <Card className="h-full transition hover:border-sky-400/50">
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Note
                    </span>
                    <p className="mt-2 font-medium text-ink-900">{note.topic}</p>
                    <p className="mt-1 text-xs text-ink-300">
                      {note.subject ?? "General"} &middot; {timeAgo(note.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))}

            {showFlashcards &&
              filteredFlashcards.map((set) => (
                <Link key={set.id} href={`/student/flashcards/${set.id}`}>
                  <Card className="h-full transition hover:border-sky-400/50">
                    <span className="inline-flex items-center rounded-full bg-gold-300/25 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gold-600">
                      Flashcards
                    </span>
                    <p className="mt-2 font-medium text-ink-900">{set.topic}</p>
                    <p className="mt-1 text-xs text-ink-300">
                      {set._count.cards} cards &middot; {timeAgo(set.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))}

            {showQuizzes &&
              filteredQuizzes.map((quiz) => (
                <Link key={quiz.id} href={`/student/quizzes/${quiz.id}`}>
                  <Card className="h-full transition hover:border-sky-400/50">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Quiz
                    </span>
                    <p className="mt-2 font-medium text-ink-900">{quiz.topic}</p>
                    <p className="mt-1 text-xs text-ink-300">
                      {quiz.attempted ? `Scored ${quiz.score}/${quiz.totalQuestions}` : `${quiz._count.questions} questions`}{" "}
                      &middot; {timeAgo(quiz.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
