"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getNote, listBookings, shareNote, notePdfUrl, ApiError, type Note, type Booking } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";
import { ShareNoteButton } from "@/components/share-note-button";

export default function NoteDetailPage({ params }: PageProps<"/student/notes/[id]">) {
  const { id } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNote(id)
      .then(setNote)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this note."));
    listBookings()
      .then(setBookings)
      .catch(() => {});
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
        <div className="flex flex-wrap gap-2">
          <Link href={`/student/flashcards/generate?noteId=${note.id}`} className={buttonClass("gold")}>
            Make flashcards
          </Link>
          <Link href={`/student/quizzes/generate?noteId=${note.id}`} className={buttonClass("outline")}>
            Make a quiz
          </Link>
          <a href={notePdfUrl(note.id)} className={buttonClass("outline")}>
            Download PDF
          </a>
        </div>
      </div>

      <Card className="mt-6">
        <MarkdownContent content={note.content} />
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-base font-semibold text-ink-900">Share with a tutor</h2>
        <p className="mt-1 text-sm text-ink-500">Sends this note into the chat of a session you pick.</p>
        <div className="mt-3">
          <ShareNoteButton bookings={bookings} counterpart="tutor" onShare={(bookingId) => shareNote(note.id, bookingId).then(() => {})} />
        </div>
      </Card>
    </div>
  );
}
