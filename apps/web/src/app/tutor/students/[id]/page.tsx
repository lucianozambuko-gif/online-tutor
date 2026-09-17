"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getTutorStudent,
  listTutorNotes,
  ApiError,
  type Booking,
  type TutorNote,
} from "@/lib/api";
import { Card, ErrorText, StatusBadge } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";
import { TutorNoteForm } from "@/components/tutor-note-form";
import { NoteAttachment } from "@/components/note-attachment";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function TutorStudentDetailPage({ params }: PageProps<"/tutor/students/[id]">) {
  const { id } = use(params);
  const [student, setStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<TutorNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  function loadNotes() {
    listTutorNotes(id)
      .then(setNotes)
      .catch(() => {});
  }

  useEffect(() => {
    getTutorStudent(id)
      .then((data) => {
        setStudent(data.student);
        setBookings(data.bookings);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this student."));
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/tutor/students" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to students
        </Link>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  if (!student) {
    return <p className="text-sm text-ink-500">Loading student...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/tutor/students" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to students
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100">
            <span className="font-display text-base font-semibold text-sky-700">{initials(student.name)}</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">{student.name}</h1>
            <p className="text-sm text-ink-500">{student.email}</p>
          </div>
        </div>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Session history</h2>
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-700/10 p-3.5">
              <div>
                <p className="text-sm font-medium text-ink-900">{b.subject}</p>
                <p className="text-xs text-ink-500">{formatWhen(b.scheduledAt)}</p>
              </div>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      </Card>

      <TutorNoteForm studentId={id} onCreated={(note) => setNotes((prev) => [note, ...prev])} />

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Notes</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No notes yet for {student.name.split(" ")[0]}.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-ink-700/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{note.topic}</p>
                  <span className="text-xs text-ink-300">{timeAgo(note.createdAt)}</span>
                </div>
                <div className="mt-2 text-sm text-ink-700">
                  <MarkdownContent content={note.content} />
                </div>
                <NoteAttachment note={note} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
