"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  declineBooking,
  initiatePayment,
  listBookings,
  createReview,
  getUnreadSummary,
  ApiError,
  type Booking,
} from "@/lib/api";
import { redirectToPayfast } from "@/lib/payfast";
import { Card, buttonClass, ErrorText, StatusBadge } from "@/components/ui";
import { BookingMessages } from "@/components/booking-messages";
import { useAuth } from "@/lib/auth-context";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" strokeLinejoin="round" />
    </svg>
  );
}

// Must match EARLY_JOIN_MIN / LATE_JOIN_MIN in apps/api/src/meetings/meetings.controller.ts —
// the backend is the source of truth and will reject outside this window regardless, but
// mirroring it here lets the button only appear once it'll actually work.
const EARLY_JOIN_MIN = 15;
const LATE_JOIN_MIN = 30;

// Must match RECORDING_FEE_MARKUP in apps/api/src/payments/payments.service.ts —
// only used here to preview the add-on price before paying; the server is
// what actually calculates and charges it.
const RECORDING_FEE_MARKUP = 0.3;

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatJoinTime(date: Date, now: Date) {
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isSameDay(date, now)) return `today at ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })} at ${time}`;
}

function getJoinWindow(booking: Booking, now: Date): "before" | "open" | "after" {
  const start = new Date(booking.scheduledAt).getTime();
  const end = start + booking.durationMinutes * 60_000;
  const opens = start - EARLY_JOIN_MIN * 60_000;
  const closes = end + LATE_JOIN_MIN * 60_000;
  const t = now.getTime();
  if (t < opens) return "before";
  if (t > closes) return "after";
  return "open";
}

export function BookingsList({ role }: { role: "STUDENT" | "TUTOR" }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);
  const [expandedMessagesId, setExpandedMessagesId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [recordingChoices, setRecordingChoices] = useState<Record<string, boolean>>({});
  const [unreadByBooking, setUnreadByBooking] = useState<Record<string, number>>({});

  function loadUnread() {
    getUnreadSummary()
      .then((summary) => setUnreadByBooking(summary.byBooking))
      .catch(() => {});
  }

  // Polls rather than pushing — simple and good enough at this scale; picks
  // up a new message within 30s even if the recipient never leaves the page.
  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 30_000);
    return () => clearInterval(id);
  }, []);

  // Re-checks the join window every 30s so "Join session" activates on its
  // own right when it opens, without the tutor/student needing to refresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function load() {
    listBookings()
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load bookings"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function runAction(id: string, action: () => Promise<Booking>) {
    setActingOn(id);
    setError(null);
    try {
      await action();
      setLoading(true);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingOn(null);
    }
  }

  async function handlePay(bookingId: string) {
    setActingOn(bookingId);
    setError(null);
    try {
      const { actionUrl, fields } = await initiatePayment(bookingId, recordingChoices[bookingId]);
      redirectToPayfast(actionUrl, fields);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setActingOn(null);
    }
  }

  async function handleSubmitReview(booking: Booking) {
    const form = reviewForms[booking.id] ?? { rating: 5, comment: "" };
    setSubmittingReviewId(booking.id);
    setError(null);
    try {
      const review = await createReview({
        bookingId: booking.id,
        rating: form.rating,
        comment: form.comment.trim() || undefined,
      });
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, review } : b)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong submitting your review");
    } finally {
      setSubmittingReviewId(null);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">My bookings</h2>
      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-ink-500">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No bookings yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {bookings.map((b) => {
            const busy = actingOn === b.id;
            const other = role === "STUDENT" ? b.tutor : b.student;
            return (
              <li key={b.id} className="rounded-xl border border-ink-700/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-900">
                    {b.subject} <span className="font-normal text-ink-500">with {other.name}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {new Date(b.scheduledAt).toLocaleString()} · {b.durationMinutes} min ·{" "}
                    {b.mode === "ONLINE" ? "Online" : "In person"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.payment && (
                      <>
                        <StatusBadge status={b.payment.status} />
                        <span className="text-xs text-ink-300">R{b.payment.amount}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {b.status === "CONFIRMED" && b.mode === "ONLINE" && getJoinWindow(b, now) === "open" && (
                    <div className="flex flex-col items-start gap-1">
                      <Link
                        href={`/${role === "TUTOR" ? "tutor" : "student"}/session/${b.id}`}
                        className={buttonClass("gold")}
                      >
                        Join session
                      </Link>
                      <span className="max-w-[220px] text-[11px] leading-snug text-ink-300">
                        Right here in Lumen — no extra login needed.
                      </span>
                    </div>
                  )}
                  {b.status === "CONFIRMED" && b.mode === "ONLINE" && getJoinWindow(b, now) === "before" && (
                    <span className="max-w-[200px] text-right text-xs text-ink-300">
                      Opens {formatJoinTime(new Date(b.scheduledAt), now)}
                    </span>
                  )}
                  {role === "TUTOR" && b.status === "PENDING" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => runAction(b.id, () => acceptBooking(b.id))}
                        className={buttonClass("primary")}
                      >
                        Accept
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => runAction(b.id, () => declineBooking(b.id))}
                        className={buttonClass("danger")}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {role === "STUDENT" && b.payment?.status === "PENDING" && b.mode === "ONLINE" && (
                    <div className="flex flex-col items-end gap-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-ink-500">
                        <input
                          type="checkbox"
                          checked={recordingChoices[b.id] ?? false}
                          onChange={(e) =>
                            setRecordingChoices((prev) => ({ ...prev, [b.id]: e.target.checked }))
                          }
                        />
                        Add recording download (+R
                        {(Number(b.payment.amount) * RECORDING_FEE_MARKUP).toFixed(2)})
                      </label>
                      <button disabled={busy} onClick={() => handlePay(b.id)} className={buttonClass("gold")}>
                        Pay
                      </button>
                    </div>
                  )}
                  {role === "STUDENT" && b.payment?.status === "PENDING" && b.mode === "IN_PERSON" && (
                    <button disabled={busy} onClick={() => handlePay(b.id)} className={buttonClass("gold")}>
                      Pay
                    </button>
                  )}
                  {b.payment?.status === "PAID" && b.payment.recordingRequested && b.recordingUrl && (
                    <a
                      href={b.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass("outline")}
                    >
                      Download recording
                    </a>
                  )}
                  {role === "STUDENT" &&
                    b.payment?.status === "PAID" &&
                    b.payment.recordingRequested &&
                    !b.recordingUrl && (
                      <span className="text-xs text-ink-300">Recording not ready yet</span>
                    )}
                  {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <button
                      disabled={busy}
                      onClick={() => runAction(b.id, () => cancelBooking(b.id))}
                      className={buttonClass("outline")}
                    >
                      Cancel
                    </button>
                  )}
                  {b.status === "CONFIRMED" && b.payment?.status === "PAID" && (
                    <button
                      disabled={busy}
                      onClick={() => runAction(b.id, () => completeBooking(b.id))}
                      className={buttonClass("primary")}
                    >
                      Mark complete
                    </button>
                  )}
                  {b.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const opening = expandedMessagesId !== b.id;
                        setExpandedMessagesId(opening ? b.id : null);
                        if (opening && unreadByBooking[b.id]) {
                          setUnreadByBooking((prev) => {
                            const next = { ...prev };
                            delete next[b.id];
                            return next;
                          });
                        }
                      }}
                      className={`relative ${buttonClass("outline")}`}
                    >
                      {expandedMessagesId === b.id ? "Hide messages" : "Messages"}
                      {!!unreadByBooking[b.id] && expandedMessagesId !== b.id && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {unreadByBooking[b.id]}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {expandedMessagesId === b.id && user && (
                <div className="mt-3 border-t border-ink-700/8 pt-3">
                  <BookingMessages bookingId={b.id} currentUserId={user.id} />
                </div>
              )}

              {b.status === "COMPLETED" && (b.review || role === "STUDENT") && (
                <div className="mt-3 border-t border-ink-700/8 pt-3">
                  {b.review ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-gold-500">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <StarIcon key={n} filled={n <= b.review!.rating} />
                        ))}
                      </div>
                      {b.review.comment && <span className="text-sm text-ink-500">{b.review.comment}</span>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-0.5 text-gold-500">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                            onClick={() =>
                              setReviewForms((prev) => ({
                                ...prev,
                                [b.id]: { ...(prev[b.id] ?? { rating: 5, comment: "" }), rating: n },
                              }))
                            }
                          >
                            <StarIcon filled={n <= (reviewForms[b.id]?.rating ?? 5)} />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Optional comment"
                        value={reviewForms[b.id]?.comment ?? ""}
                        onChange={(e) =>
                          setReviewForms((prev) => ({
                            ...prev,
                            [b.id]: { ...(prev[b.id] ?? { rating: 5, comment: "" }), comment: e.target.value },
                          }))
                        }
                        className="flex-1 rounded-lg border border-ink-700/15 bg-white px-2.5 py-1.5 text-xs text-ink-900 outline-none focus:border-sky-400"
                      />
                      <button
                        type="button"
                        disabled={submittingReviewId === b.id}
                        onClick={() => handleSubmitReview(b)}
                        className={buttonClass("outline", "px-3 py-1.5 text-xs")}
                      >
                        {submittingReviewId === b.id ? "Submitting..." : "Submit review"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
