"use client";

import { useEffect, useState } from "react";
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  declineBooking,
  initiatePayment,
  listBookings,
  ApiError,
  type Booking,
} from "@/lib/api";
import { redirectToPayfast } from "@/lib/payfast";
import { Card, buttonClass, ErrorText, StatusBadge } from "@/components/ui";

export function BookingsList({ role }: { role: "STUDENT" | "TUTOR" }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  function load() {
    setLoading(true);
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
      const { actionUrl, fields } = await initiatePayment(bookingId);
      redirectToPayfast(actionUrl, fields);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setActingOn(null);
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
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-ink-700/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
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
                  {role === "STUDENT" && b.payment?.status === "PENDING" && (
                    <button disabled={busy} onClick={() => handlePay(b.id)} className={buttonClass("gold")}>
                      Pay
                    </button>
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
