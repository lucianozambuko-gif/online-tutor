"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTutorStudents, ApiError, type RosterEntry } from "@/lib/api";
import { ErrorText } from "@/components/ui";
import { TutorNoteForm } from "@/components/tutor-note-form";

export default function GenerateTutorNotePage() {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutorStudents()
      .then(setRoster)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your students."));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tutor/notes" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to notes
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">New session note</h1>

      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {!roster ? (
        <p className="mt-4 text-sm text-ink-500">Loading your students...</p>
      ) : roster.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          You don&apos;t have any students yet — accept a booking request first.
        </p>
      ) : (
        <div className="mt-5">
          <TutorNoteForm roster={roster} onCreated={(note) => router.push(`/tutor/students/${note.studentId}`)} />
        </div>
      )}
    </div>
  );
}
