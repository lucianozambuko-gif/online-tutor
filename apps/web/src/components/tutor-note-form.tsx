"use client";

import { useRef, useState, type FormEvent } from "react";
import { generateTutorNote, ApiError, type RosterEntry, type TutorNote } from "@/lib/api";
import { Card, Field, inputClass, labelClass, buttonClass, ErrorText } from "@/components/ui";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface Props {
  studentId?: string;
  roster?: RosterEntry[];
  onCreated: (note: TutorNote) => void;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9.5 12.5 18a4 4 0 0 1-5.7-5.7L15 4a2.7 2.7 0 0 1 3.8 3.8L10 16.5a1.3 1.3 0 0 1-1.9-1.8L15.5 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function TutorNoteForm({ studentId, roster, onCreated }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState(studentId ?? "");
  const [topic, setTopic] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("That file is too large — please attach one under 5MB.");
      return;
    }
    setError(null);
    setAttachment(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const note = await generateTutorNote({
        studentId: selectedStudentId || undefined,
        topic,
        rawInput,
        attachment: attachment ?? undefined,
      });
      setTopic("");
      setRawInput("");
      setAttachment(null);
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
          <Field label="Student (optional)" htmlFor="tutor-note-student">
            <select
              id="tutor-note-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className={inputClass}
            >
              <option value="">General note (no student)</option>
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

        <div className="space-y-1.5">
          <span className={labelClass}>Attachment (optional)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES}
            onChange={handlePickFile}
            className="hidden"
          />
          {attachment ? (
            <div className="flex items-center gap-2 rounded-lg border border-ink-700/15 bg-white px-3 py-2">
              <PaperclipIcon />
              <span className="flex-1 truncate text-sm text-ink-700">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
                className="text-ink-300 transition hover:text-ink-700"
              >
                <XIcon />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-700/20 px-3 py-2 text-sm text-ink-500 transition hover:border-sky-400/50 hover:text-sky-700"
            >
              <PlusIcon />
              Attach a file or photo
            </button>
          )}
          <p className="text-xs text-ink-300">
            Images, PDF or Word, up to 5MB. For a PDF/Word worksheet or test, the AI reads its content and can
            reference specifics in the note — a photo is just filed for your reference.
          </p>
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full sm:w-auto")}>
          {submitting ? "Generating..." : "Generate note"}
        </button>
      </form>
    </Card>
  );
}
