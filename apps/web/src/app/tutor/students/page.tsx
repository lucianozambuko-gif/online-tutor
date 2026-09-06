"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTutorStudents, ApiError, type RosterEntry } from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TutorStudentsPage() {
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutorStudents()
      .then(setRoster)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your students."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Students</h1>
        <p className="mt-1 text-sm text-ink-500">Everyone you&apos;ve tutored, with their session history.</p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {!roster ? (
        <p className="text-sm text-ink-500">Loading your students...</p>
      ) : roster.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">No students yet — once you accept a request, they&apos;ll show up here.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roster.map((entry) => (
            <Link
              key={entry.student.id}
              href={`/tutor/students/${entry.student.id}`}
              className="rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm transition hover:border-sky-400/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100">
                  <span className="font-display text-sm font-semibold text-sky-700">{initials(entry.student.name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{entry.student.name}</p>
                  <p className="truncate text-xs text-ink-300">{entry.subjects.join(", ")}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                <span>
                  {entry.sessionCount} session{entry.sessionCount === 1 ? "" : "s"}
                </span>
                {entry.nextSession ? (
                  <span className="font-medium text-gold-600">Next: {formatDate(entry.nextSession)}</span>
                ) : entry.lastSession ? (
                  <span>Last: {formatDate(entry.lastSession)}</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
