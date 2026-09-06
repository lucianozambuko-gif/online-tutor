"use client";

import { useEffect, useState } from "react";
import { listBookings, acceptBooking, declineBooking, ApiError, type Booking } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TutorRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  function load() {
    listBookings()
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load requests"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function respond(id: string, action: (id: string) => Promise<Booking>) {
    setActingOn(id);
    setError(null);
    try {
      await action(id);
      setLoading(true);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingOn(null);
    }
  }

  const requests = bookings.filter((b) => b.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Requests</h1>
        <p className="mt-1 text-sm text-ink-500">New session requests waiting on your response.</p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <p className="text-sm text-ink-500">Loading requests...</p>
      ) : requests.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">No pending requests right now.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((b) => {
            const busy = actingOn === b.id;
            return (
              <Card key={b.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-900">
                    {b.subject} <span className="font-normal text-ink-500">with {b.student.name}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {formatWhen(b.scheduledAt)} · {b.durationMinutes} min · {b.mode === "ONLINE" ? "Online" : "In person"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-300">{b.student.email}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => respond(b.id, acceptBooking)} className={buttonClass("primary")}>
                    Accept
                  </button>
                  <button disabled={busy} onClick={() => respond(b.id, declineBooking)} className={buttonClass("danger")}>
                    Decline
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
