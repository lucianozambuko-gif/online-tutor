"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getNote, ApiError, type Note } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";

export default function NoteDetailPage({ params }: PageProps<"/student/notes/[id]">) {
  const { id } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNote(id)
      .then(setNote)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this note."));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to dashboard
        </Link>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  if (!note) {
    return <p className="text-sm text-ink-500">Loading note...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/student/library?tab=notes" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to notes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{note.topic}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {note.subject ?? "General"} &middot; {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/student/flashcards/generate?noteId=${note.id}`} className={buttonClass("gold")}>
            Make flashcards
          </Link>
          <Link href={`/student/quizzes/generate?noteId=${note.id}`} className={buttonClass("outline")}>
            Make a quiz
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <MarkdownContent content={note.content} />
      </Card>
    </div>
  );
}
