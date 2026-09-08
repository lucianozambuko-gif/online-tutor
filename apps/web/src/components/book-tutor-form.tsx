"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createBooking, listTutors, ApiError, GRADE_LEVEL_LABELS, type TutorSummary } from "@/lib/api";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export function BookTutorForm({ onBooked }: { onBooked: () => void }) {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [tutorId, setTutorId] = useState("");
  const [subject, setSubject] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listTutors()
      .then((list) => {
        setTutors(list);
        if (list.length > 0) setTutorId(list[0].id);
      })
      .catch(() => setError("Failed to load tutors"));
  }, []);

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
      setSubject("");
      setScheduledAt("");
      onBooked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Book a tutor</h2>
      {tutors.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No tutors available to book yet.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Tutor" htmlFor="tutorId">
              <select id="tutorId" className={inputClass} value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
                {tutors.map((t) => {
                  const levels = t.tutorProfile.gradeLevels.map((l) => GRADE_LEVEL_LABELS[l]).join(", ");
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.tutorProfile.subjects.join(", ")}
                      {levels ? ` (${levels})` : ""} — R{t.tutorProfile.hourlyRate}/hr
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>
          <Field label="Subject" htmlFor="subject">
            <input id="subject" required className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
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
          <Field label="Mode" htmlFor="mode">
            <select id="mode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as "ONLINE" | "IN_PERSON")}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </Field>
          {error && (
            <div className="sm:col-span-2">
              <ErrorText>{error}</ErrorText>
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className={buttonClass("primary")}>
              {submitting ? "Booking..." : "Book session"}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
