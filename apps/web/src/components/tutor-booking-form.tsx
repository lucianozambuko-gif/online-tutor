"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBooking, initiatePayment, ApiError } from "@/lib/api";
import { redirectToPayfast } from "@/lib/payfast";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

// Must match RECORDING_FEE_MARKUP in apps/api/src/payments/payments.service.ts —
// only used here to preview the add-on price before paying; the server is
// what actually calculates and charges it.
const RECORDING_FEE_MARKUP = 0.3;

export function TutorBookingForm({
  tutorId,
  subjects,
  hourlyRate,
}: {
  tutorId: string;
  subjects: string[];
  hourlyRate: number;
}) {
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [wantsRecording, setWantsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdButUnpaid, setCreatedButUnpaid] = useState(false);

  const sessionAmount = Math.round(hourlyRate * (durationMinutes / 60) * 100) / 100;
  const recordingFee = Math.round(sessionAmount * RECORDING_FEE_MARKUP * 100) / 100;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedButUnpaid(false);
    setSubmitting(true);
    try {
      const booking = await createBooking({
        tutorId,
        subject,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        mode,
      });
      try {
        const { actionUrl, fields } = await initiatePayment(booking.id, mode === "ONLINE" && wantsRecording);
        redirectToPayfast(actionUrl, fields);
        // Page is navigating away to PayFast — leave submitting true so the
        // button stays disabled rather than flashing back before the redirect lands.
      } catch (payErr) {
        // Booking exists (unpaid) even though starting payment failed — don't
        // let the student think nothing happened.
        setCreatedButUnpaid(true);
        setError(payErr instanceof ApiError ? payErr.message : "Couldn't start payment");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Book a session</h2>
      <p className="mt-1 text-sm text-ink-500">
        This slot is held for you as soon as you pay — you&apos;ll be redirected to PayFast next.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Subject" htmlFor="subject">
            {subjects.length > 0 ? (
              <select id="subject" required className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input id="subject" required className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
            )}
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
        {mode === "ONLINE" && (
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={wantsRecording} onChange={(e) => setWantsRecording(e.target.checked)} />
              Add recording download (+R{recordingFee.toFixed(2)})
            </label>
          </div>
        )}
        <div className="sm:col-span-2 text-sm font-medium text-ink-900">
          Total: R{(sessionAmount + (mode === "ONLINE" && wantsRecording ? recordingFee : 0)).toFixed(2)}
        </div>
        {error && (
          <div className="sm:col-span-2">
            <ErrorText>{error}</ErrorText>
            {createdButUnpaid && (
              <p className="mt-1 text-sm text-ink-500">
                Your booking was created but isn&apos;t paid yet —{" "}
                <Link href="/student#my-bookings" className="text-sky-700 hover:text-sky-800">
                  finish paying from My bookings
                </Link>{" "}
                before the hold expires.
              </p>
            )}
          </div>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className={buttonClass("primary")}>
            {submitting ? "Redirecting to payment..." : "Book & pay"}
          </button>
        </div>
      </form>
    </Card>
  );
}
