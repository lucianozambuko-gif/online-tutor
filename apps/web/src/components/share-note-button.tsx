"use client";

import { useState } from "react";
import { ApiError, type Booking } from "@/lib/api";
import { buttonClass, inputClass, ErrorText } from "@/components/ui";

function bookingLabel(booking: Booking, counterpartName: string) {
  const date = new Date(booking.scheduledAt).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${counterpartName} — ${booking.subject} (${date})`;
}

export function ShareNoteButton({
  bookings,
  counterpart,
  onShare,
}: {
  bookings: Booking[];
  counterpart: "student" | "tutor";
  onShare: (bookingId: string) => Promise<void>;
}) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? "");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-ink-300">
        No sessions with this {counterpart} to share into yet.
      </p>
    );
  }

  async function handleShare() {
    if (!bookingId) return;
    setSharing(true);
    setError(null);
    try {
      await onShare(bookingId);
      setShared(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't share this note");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className={`${inputClass} sm:w-auto`}>
        {bookings.map((b) => (
          <option key={b.id} value={b.id}>
            {bookingLabel(b, counterpart === "student" ? b.student.name : b.tutor.name)}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleShare} disabled={sharing} className={buttonClass("outline")}>
        {sharing ? "Sharing..." : "Share to chat"}
      </button>
      {shared && <span className="text-sm text-emerald-600">Shared — sent to that chat.</span>}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
