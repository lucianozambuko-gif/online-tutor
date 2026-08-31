"use client";

import { useState, type FormEvent } from "react";
import { updateOwnTutorProfile, ApiError } from "@/lib/api";

export function TutorProfileForm() {
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateOwnTutorProfile({
        subjects: subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        bio: bio || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>My tutor profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="subjects">Subjects (comma-separated)</label>
          <input id="subjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
        </div>
        <div>
          <label htmlFor="hourlyRate">Hourly rate (ZAR)</label>
          <input
            id="hourlyRate"
            type="number"
            min={0}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        {error && <p role="alert">{error}</p>}
        {saved && <p>Saved.</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
