"use client";

import { useEffect, useMemo, useState } from "react";
import { listBookings, type Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, inputClass } from "@/components/ui";
import { BookingMessages } from "@/components/booking-messages";

// Shown on a tutor's profile only once the student actually has a (non-
// cancelled) booking with them — messaging before that goes through the
// booking request flow instead, there's no conversation to attach it to.
export function TutorMessagesSection({ tutorId }: { tutorId: string }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    listBookings()
      .then((all) => {
        const withTutor = all
          .filter((b) => b.tutor.id === tutorId && b.status !== "CANCELLED")
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        setBookings(withTutor);
        setBookingId((prev) => prev || withTutor[0]?.id || "");
      })
      .catch(() => setBookings([]));
  }, [tutorId]);

  const selected = useMemo(() => bookings?.find((b) => b.id === bookingId), [bookings, bookingId]);

  if (!user || !bookings || bookings.length === 0) return null;

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Messages</h2>
      {bookings.length > 1 && (
        <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className={`${inputClass} mt-2`}>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.subject} — {new Date(b.scheduledAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      )}
      {selected && (
        <div className="mt-3">
          <BookingMessages bookingId={selected.id} currentUserId={user.id} />
        </div>
      )}
    </Card>
  );
}
