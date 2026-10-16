"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getTutorNote, listBookings, shareTutorNote, tutorNotePdfUrl, ApiError, type TutorNote, type Booking } from "@/lib/api";
import { Card, ErrorText, buttonClass } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";
import { NoteAttachment } from "@/components/note-attachment";
import { ShareNoteButton } from "@/components/share-note-button";

export default function TutorNoteDetailPage({ params }: PageProps<"/tutor/notes/[id]">) {
  const { id } = use(params);
  const [note, setNote] = useState<TutorNote | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTutorNote(id)
      .then(setNote)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this note."));
    listBookings()
      .then(setBookings)
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/tutor/notes" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to notes
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
      <Link href="/tutor/notes" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to notes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{note.topic}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {note.student ? (
              <>
                About{" "}
                <Link href={`/tutor/students/${note.student.id}`} className="font-medium text-sky-700 hover:text-sky-800">
                  {note.student.name}
                </Link>
              </>
            ) : (
              "General note"
            )}{" "}
            &middot; {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <a href={tutorNotePdfUrl(note.id)} className={buttonClass("outline")}>
          Download PDF
        </a>
      </div>

      <Card className="mt-6">
        <MarkdownContent content={note.content} />
        <NoteAttachment note={note} />
      </Card>

      {note.student && (
        <Card className="mt-4">
          <h2 className="font-display text-base font-semibold text-ink-900">Share with {note.student.name}</h2>
          <p className="mt-1 text-sm text-ink-500">Sends this note into the chat of a session you pick.</p>
          <div className="mt-3">
            <ShareNoteButton
              bookings={bookings.filter((b) => b.student.id === note.student?.id)}
              counterpart="student"
              onShare={(bookingId) => shareTutorNote(note.id, bookingId).then(() => {})}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
