"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBookings, getUnreadSummary, ApiError, type Booking } from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";
import { BookingMessages } from "@/components/booking-messages";
import { useAuth } from "@/lib/auth-context";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function StudentMessagesPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unreadByBooking, setUnreadByBooking] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function loadUnread() {
    getUnreadSummary()
      .then((s) => setUnreadByBooking(s.byBooking))
      .catch(() => {});
  }

  useEffect(() => {
    listBookings()
      .then((all) => setBookings(all.filter((b) => b.status !== "CANCELLED")))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your messages"))
      .finally(() => setLoading(false));
    loadUnread();
    const id = setInterval(loadUnread, 30_000);
    return () => clearInterval(id);
  }, []);

  // Conversations with something unread float to the top; everything else
  // stays ordered by session date, most recent first.
  const sorted = [...bookings].sort((a, b) => {
    const unreadDiff = (unreadByBooking[b.id] ? 1 : 0) - (unreadByBooking[a.id] ? 1 : 0);
    if (unreadDiff !== 0) return unreadDiff;
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });

  function toggle(bookingId: string) {
    const opening = openId !== bookingId;
    setOpenId(opening ? bookingId : null);
    if (opening && unreadByBooking[bookingId]) {
      setUnreadByBooking((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Messages</h1>
      <p className="mt-1 text-sm text-ink-500">Every conversation with a tutor, in one place.</p>

      <div className="mt-6">
        {error && <ErrorText>{error}</ErrorText>}
        {loading ? (
          <p className="text-sm text-ink-500">Loading messages...</p>
        ) : sorted.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-500">
              No conversations yet —{" "}
              <Link href="/student/tutors" className="text-sky-700 hover:text-sky-800">
                book a tutor
              </Link>{" "}
              to start one.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sorted.map((b) => {
              const unread = unreadByBooking[b.id] ?? 0;
              const isOpen = openId === b.id;
              return (
                <li key={b.id} className="rounded-xl border border-ink-700/10 bg-white">
                  <button
                    type="button"
                    onClick={() => toggle(b.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <span className="font-display text-sm font-semibold text-sky-700">{initials(b.tutor.name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">{b.tutor.name}</p>
                      <p className="truncate text-xs text-ink-500">
                        {b.subject} · {new Date(b.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                  {isOpen && user && (
                    <div className="border-t border-ink-700/8 p-4 pt-3">
                      <BookingMessages bookingId={b.id} currentUserId={user.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
