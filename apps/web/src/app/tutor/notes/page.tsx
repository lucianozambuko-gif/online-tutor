"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTutorNotes, ApiError, type TutorNote } from "@/lib/api";
import { Card, ErrorText, buttonClass } from "@/components/ui";

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function TutorNotesPage() {
  const [notes, setNotes] = useState<TutorNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutorNotes()
      .then(setNotes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your notes."));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Notes</h1>
          <p className="mt-1 text-sm text-ink-500">Session notes across all your students.</p>
        </div>
        <Link href="/tutor/notes/generate" className={buttonClass("primary")}>
          New note
        </Link>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {!notes ? (
        <p className="text-sm text-ink-500">Loading notes...</p>
      ) : notes.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">No notes yet — write your first one after a session.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const content = (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink-900">{note.topic}</p>
                  <span className="text-xs text-ink-300">{timeAgo(note.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">{note.student?.name ?? "General note"}</p>
              </>
            );
            const className =
              "block rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm transition hover:border-sky-400/50 hover:shadow-md";
            return note.student ? (
              <Link key={note.id} href={`/tutor/students/${note.student.id}`} className={className}>
                {content}
              </Link>
            ) : (
              <div key={note.id} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
