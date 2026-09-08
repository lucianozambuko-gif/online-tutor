"use client";

import { useEffect, useState } from "react";
import { listTutorReviews, ApiError, type TutorReview } from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-gold-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="15" height="15" viewBox="0 0 24 24" fill={n <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function TutorReviewsCard({ tutorId }: { tutorId: string }) {
  const [reviews, setReviews] = useState<TutorReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutorReviews(tutorId)
      .then(setReviews)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your reviews."));
  }, [tutorId]);

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Student reviews</h2>
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      {!reviews ? (
        <p className="mt-3 text-sm text-ink-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No reviews yet — they&apos;ll show up here after a student rates a completed session.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-ink-700/10 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Stars rating={r.rating} />
                <span className="text-xs text-ink-300">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-ink-500">{r.studentDisplayName}</p>
              {r.comment && <p className="mt-1.5 text-sm text-ink-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
