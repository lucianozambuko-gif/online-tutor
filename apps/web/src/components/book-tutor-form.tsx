"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createBooking, listTutors, ApiError, type TutorSummary } from "@/lib/api";

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

  if (tutors.length === 0) {
    return <p>No tutors available to book yet.</p>;
  }

  return (
    <section>
      <h2>Book a tutor</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="tutorId">Tutor</label>
          <select id="tutorId" value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.tutorProfile.subjects.join(", ")} (R{t.tutorProfile.hourlyRate}/hr)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subject">Subject</label>
          <input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label htmlFor="scheduledAt">Date &amp; time</label>
          <input
            id="scheduledAt"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="durationMinutes">Duration (minutes)</label>
          <input
            id="durationMinutes"
            type="number"
            min={15}
            step={15}
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="mode">Mode</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "ONLINE" | "IN_PERSON")}>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In person</option>
          </select>
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Booking..." : "Book session"}
        </button>
      </form>
    </section>
  );
}
