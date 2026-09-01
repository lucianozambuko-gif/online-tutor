"use client";

import { useState, type FormEvent } from "react";
import { updateOwnTutorProfile, ApiError } from "@/lib/api";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

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
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">My tutor profile</h2>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Subjects (comma-separated)" htmlFor="subjects">
          <input id="subjects" className={inputClass} value={subjects} onChange={(e) => setSubjects(e.target.value)} />
        </Field>
        <Field label="Hourly rate (ZAR)" htmlFor="hourlyRate">
          <input
            id="hourlyRate"
            type="number"
            min={0}
            className={inputClass}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bio" htmlFor="bio">
            <textarea id="bio" rows={3} className={inputClass} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
        </div>
        {error && (
          <div className="sm:col-span-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={submitting} className={buttonClass("primary")}>
            {submitting ? "Saving..." : "Save profile"}
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}
