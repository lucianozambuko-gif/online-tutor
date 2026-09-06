"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateNote, ApiError } from "@/lib/api";
import { Field, inputClass, buttonClass, ErrorText, Card } from "@/components/ui";

const SUBJECTS = [
  "Mathematics",
  "Physical Sciences",
  "Life Sciences",
  "Accounting",
  "Economics",
  "Business Studies",
  "Geography",
  "History",
  "English Home Language",
  "Afrikaans",
  "isiZulu",
];

export default function GenerateNotesPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const note = await generateNote({
        topic: topic.trim(),
        subject: subject || undefined,
        sourceText: sourceText.trim() || undefined,
      });
      router.push(`/student/notes/${note.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong generating your notes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Generate notes</h1>
      <p className="mt-1 text-sm text-ink-500">Turn any topic into curriculum-aligned study notes.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Topic" htmlFor="topic" hint="Be specific — e.g. 'Stoichiometry, mole-to-mole calculations'">
            <input
              id="topic"
              required
              maxLength={200}
              className={inputClass}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Stoichiometry, mole-to-mole calculations"
            />
          </Field>

          <Field label="Subject (optional)" htmlFor="subject">
            <select id="subject" className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">No subject — general</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Source material (optional)"
            htmlFor="sourceText"
            hint="Paste lecture notes, a textbook excerpt, or anything the notes should be based on."
          >
            <textarea
              id="sourceText"
              rows={6}
              maxLength={8000}
              className={inputClass}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Optional — paste text here"
            />
          </Field>

          {error && <ErrorText>{error}</ErrorText>}

          <button type="submit" disabled={submitting || !topic.trim()} className={buttonClass("primary", "w-full")}>
            {submitting ? "Generating..." : "Generate notes"}
          </button>
        </form>
      </Card>
    </div>
  );
}
