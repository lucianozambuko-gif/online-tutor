"use client";

import { useState, type FormEvent } from "react";
import { generateTutorNote, ApiError, type RosterEntry, type TutorNote } from "@/lib/api";
import { Card, Field, inputClass, labelClass, buttonClass, ErrorText } from "@/components/ui";

interface Props {
  studentId?: string;
  roster?: RosterEntry[];
  onCreated: (note: TutorNote) => void;
}

export function TutorNoteForm({ studentId, roster, onCreated }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState(studentId ?? roster?.[0]?.student.id ?? "");
  const [topic, setTopic] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const note = await generateTutorNote({ studentId: selectedStudentId, topic, rawInput });
      setTopic("");
      setRawInput("");
      onCreated(note);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong generating this note");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Write a session note</h2>
      <p className="mt-1 text-sm text-ink-500">
        Jot down rough bullet points from the session — Lumen AI will turn them into a clear, structured note.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {roster && (
          <Field label="Student" htmlFor="tutor-note-student">
            <select
              id="tutor-note-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className={inputClass}
            >
              {roster.map((entry) => (
                <option key={entry.student.id} value={entry.student.id}>
                  {entry.student.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Topic" htmlFor="tutor-note-topic">
          <input
            id="tutor-note-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. Quadratic equations — session 3"
            className={inputClass}
          />
        </Field>

        <div className="space-y-1.5">
          <label htmlFor="tutor-note-raw" className={labelClass}>
            Your notes
          </label>
          <textarea
            id="tutor-note-raw"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            required
            maxLength={4000}
            rows={5}
            placeholder="- struggled with factoring at first, clicked after the area-model example&#10;- confident with the quadratic formula now&#10;- homework: 10 practice problems, worksheet 4"
            className={`${inputClass} resize-y`}
          />
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <button type="submit" disabled={submitting || !selectedStudentId} className={buttonClass("primary", "w-full sm:w-auto")}>
          {submitting ? "Generating..." : "Generate note"}
        </button>
      </form>
    </Card>
  );
}
