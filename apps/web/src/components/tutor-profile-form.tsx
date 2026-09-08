"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  updateOwnTutorProfile,
  ApiError,
  GRADE_LEVEL_LABELS,
  MIN_HOURLY_RATE_ZAR,
  type GradeLevel,
  type OwnTutorProfile,
} from "@/lib/api";
import { Card, Field, inputClass, labelClass, buttonClass, ErrorText } from "@/components/ui";

const MAX_SUBJECTS = 3;
const GRADE_LEVELS: GradeLevel[] = ["PRIMARY", "HIGH_SCHOOL", "VARSITY"];

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function TutorProfileForm({ initial }: { initial: OwnTutorProfile }) {
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [subjectInput, setSubjectInput] = useState("");
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>(initial.gradeLevels);
  const [hourlyRate, setHourlyRate] = useState(initial.hourlyRate);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function addSubject() {
    const value = subjectInput.trim();
    if (!value || subjects.length >= MAX_SUBJECTS || subjects.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSubjectInput("");
      return;
    }
    setSubjects((prev) => [...prev, value]);
    setSubjectInput("");
  }

  function handleSubjectKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSubject();
    }
  }

  function removeSubject(value: string) {
    setSubjects((prev) => prev.filter((s) => s !== value));
  }

  function toggleGradeLevel(level: GradeLevel) {
    setGradeLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateOwnTutorProfile({
        subjects,
        gradeLevels,
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
        <div className="sm:col-span-2">
          <Field label={`Subjects (up to ${MAX_SUBJECTS})`} htmlFor="subject-input">
            <div className="flex flex-wrap items-center gap-2">
              {subjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    aria-label={`Remove ${subject}`}
                    className="text-sky-700/60 transition hover:text-sky-700"
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
              {subjects.length < MAX_SUBJECTS && (
                <input
                  id="subject-input"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={handleSubjectKeyDown}
                  onBlur={addSubject}
                  placeholder="e.g. Mathematics"
                  className="min-w-[140px] flex-1 rounded-lg border border-ink-700/15 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                />
              )}
            </div>
            <p className="mt-1.5 text-xs text-ink-300">Press Enter after each subject.</p>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>Grade levels you tutor</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {GRADE_LEVELS.map((level) => {
              const active = gradeLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleGradeLevel(level)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-sky-600 text-white shadow-sm"
                      : "border border-ink-700/15 bg-white text-ink-500 hover:border-sky-400/50 hover:text-ink-900"
                  }`}
                >
                  {GRADE_LEVEL_LABELS[level]}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Hourly rate (ZAR)" htmlFor="hourlyRate" hint={`Minimum R${MIN_HOURLY_RATE_ZAR}/hr.`}>
          <input
            id="hourlyRate"
            type="number"
            min={MIN_HOURLY_RATE_ZAR}
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
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}
