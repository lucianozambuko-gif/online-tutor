"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getTutor,
  listTutorReviews,
  getTutorImprovementProofs,
  ApiError,
  GRADE_LEVEL_LABELS,
  type TutorSummary,
  type TutorReview,
  type VerifiedImprovementProof,
} from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";
import { TutorBookingForm } from "@/components/tutor-booking-form";
import { TutorBusySlots } from "@/components/tutor-busy-slots";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" strokeLinejoin="round" />
    </svg>
  );
}

export default function TutorProfilePage({ params }: PageProps<"/student/tutors/[id]">) {
  const { id } = use(params);
  const [tutor, setTutor] = useState<TutorSummary | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [improvementProofs, setImprovementProofs] = useState<VerifiedImprovementProof[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTutor(id)
      .then(setTutor)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this tutor"));
    listTutorReviews(id)
      .then(setReviews)
      .catch(() => {});
    getTutorImprovementProofs(id)
      .then(setImprovementProofs)
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link href="/student/tutors" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to tutors
        </Link>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return <p className="text-sm text-ink-500">Loading tutor profile...</p>;
  }

  const levels =
    tutor.tutorProfile.specificGrades.length > 0
      ? tutor.tutorProfile.specificGrades.join(", ")
      : tutor.tutorProfile.gradeLevels.map((l) => GRADE_LEVEL_LABELS[l]).join(", ");
  const rating = tutor.tutorProfile.avgRating ? Number(tutor.tutorProfile.avgRating).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/student/tutors" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to tutors
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              {tutor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tutor.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-100">
                  <span className="font-display text-lg font-semibold text-sky-700">{initials(tutor.name)}</span>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold text-ink-900">{tutor.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                  {rating && (
                    <span className="inline-flex items-center gap-1 text-gold-600">
                      <StarIcon filled /> {rating}
                    </span>
                  )}
                  <span>R{Number(tutor.tutorProfile.hourlyRate).toFixed(0)}/hr</span>
                  {tutor.tutorProfile.transcriptVerified && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      🎓 Verified marks
                    </span>
                  )}
                </div>
              </div>
            </div>

            {tutor.tutorProfile.bio && <p className="mt-4 text-sm text-ink-700">{tutor.tutorProfile.bio}</p>}

            <div className="mt-4 flex flex-wrap gap-4 border-t border-ink-700/8 pt-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Subjects</p>
                <p className="mt-1 text-ink-700">{tutor.tutorProfile.subjects.join(", ") || "Not listed"}</p>
              </div>
              {levels && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Grade levels</p>
                  <p className="mt-1 text-ink-700">{levels}</p>
                </div>
              )}
              {tutor.tutorProfile.qualifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Qualifications</p>
                  <p className="mt-1 text-ink-700">{tutor.tutorProfile.qualifications.join(", ")}</p>
                </div>
              )}
            </div>
          </Card>

          {improvementProofs.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-semibold text-ink-900">Verified improvement</h2>
              <p className="mt-1 text-sm text-ink-500">Admin-verified before/after marks from past students.</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {improvementProofs.map((p) => (
                  <li
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    ✓ {p.subject}: {p.beforeMark} → {p.afterMark}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-lg font-semibold text-ink-900">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-ink-700/8 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-0.5 text-gold-500">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <StarIcon key={n} filled={n <= r.rating} />
                        ))}
                      </div>
                      <span className="text-xs text-ink-300">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-ink-500">{r.studentDisplayName}</p>
                    {r.comment && <p className="mt-1.5 text-sm text-ink-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <TutorBookingForm tutorId={tutor.id} subjects={tutor.tutorProfile.subjects} />
          <TutorBusySlots tutorId={tutor.id} />
        </div>
      </div>
    </div>
  );
}
