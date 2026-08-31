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

  if (loading) return <p>Loading bookings...</p>;

  return (
    <section>
      <h2>My bookings</h2>
      {error && <p role="alert">{error}</p>}
      {bookings.length === 0 && <p>No bookings yet.</p>}
      <ul>
        {bookings.map((b) => {
          const busy = actingOn === b.id;
          const other = role === "STUDENT" ? b.tutor : b.student;
          return (
            <li key={b.id}>
              <strong>{b.subject}</strong> with {other.name} —{" "}
              {new Date(b.scheduledAt).toLocaleString()} ({b.durationMinutes}min, {b.mode})
              <br />
              Booking: {b.status} | Payment: {b.payment?.status ?? "—"}{" "}
              {b.payment && `(R${b.payment.amount})`}
              <br />
              {role === "TUTOR" && b.status === "PENDING" && (
                <>
                  <button disabled={busy} onClick={() => runAction(b.id, () => acceptBooking(b.id))}>
                    Accept
                  </button>{" "}
                  <button disabled={busy} onClick={() => runAction(b.id, () => declineBooking(b.id))}>
                    Decline
                  </button>{" "}
                </>
              )}
              {role === "STUDENT" && b.payment?.status === "PENDING" && (
                <button disabled={busy} onClick={() => handlePay(b.id)}>
                  Pay
                </button>
              )}{" "}
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button disabled={busy} onClick={() => runAction(b.id, () => cancelBooking(b.id))}>
                  Cancel
                </button>
              )}{" "}
              {b.status === "CONFIRMED" && b.payment?.status === "PAID" && (
                <button disabled={busy} onClick={() => runAction(b.id, () => completeBooking(b.id))}>
                  Mark complete
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
