"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBooking, ApiError } from "@/lib/api";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export function TutorBookingForm({ tutorId }: { tutorId: string }) {
  const [subject, setSubject] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createBooking({
        tutorId,
        subject,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        mode,
      });
      setBooked(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (booked) {
    return (
      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Request sent</h2>
        <p className="mt-2 text-sm text-ink-500">
          Your booking request has been sent to the tutor. You&apos;ll be able to pay once they accept it.
        </p>
        <Link href="/student#my-bookings" className={buttonClass("primary", "mt-4")}>
          View my bookings
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Book a session</h2>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Subject" htmlFor="subject">
            <input id="subject" required className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
        </div>
        <Field label="Date & time" htmlFor="scheduledAt">
          <input
            id="scheduledAt"
            type="datetime-local"
            required
            className={inputClass}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>
        <Field label="Duration (minutes)" htmlFor="durationMinutes">
          <input
            id="durationMinutes"
            type="number"
            min={15}
            step={15}
            required
            className={inputClass}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Mode" htmlFor="mode">
            <select id="mode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as "ONLINE" | "IN_PERSON")}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </Field>
        </div>
        {error && (
          <div className="sm:col-span-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className={buttonClass("primary")}>
            {submitting ? "Booking..." : "Request session"}
          </button>
        </div>
      </form>
    </Card>
  );
}
