"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listTutors, ApiError, GRADE_LEVEL_LABELS, type TutorSummary } from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutors()
      .then(setTutors)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load tutors"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <div className="mt-4">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Book a tutor</h1>
        <p className="mt-1 text-sm text-ink-500">Browse approved tutors and open a profile to see their reviews, schedule and book a session.</p>
      </div>

      <div className="mt-6">
        {error && <ErrorText>{error}</ErrorText>}
        {loading ? (
          <p className="text-sm text-ink-500">Loading tutors...</p>
        ) : tutors.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-500">No tutors available to book yet.</p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((t) => {
              const rating = t.tutorProfile.avgRating ? Number(t.tutorProfile.avgRating).toFixed(1) : null;
              const levels = t.tutorProfile.gradeLevels.map((l) => GRADE_LEVEL_LABELS[l]).join(", ");
              return (
                <Link key={t.id} href={`/student/tutors/${t.id}`} className="block">
                  <Card className="h-full transition hover:border-sky-400/50 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      {t.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100">
                          <span className="font-display text-sm font-semibold text-sky-700">{initials(t.name)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-display font-semibold text-ink-900">{t.name}</p>
                        {rating && <p className="text-xs text-ink-500">⭐ {rating}</p>}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-ink-700">
                      {t.tutorProfile.subjects.length > 0 ? t.tutorProfile.subjects.join(", ") : "No subjects listed"}
                    </p>
                    {levels && <p className="mt-0.5 text-xs text-ink-300">{levels}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">R{Number(t.tutorProfile.hourlyRate).toFixed(0)}/hr</span>
                      {t.tutorProfile.transcriptVerified && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          🎓 Verified marks
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
