"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  uploadImprovementProof,
  listMyImprovementProofs,
  ApiError,
  type ImprovementProof,
} from "@/lib/api";
import { Card, Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

export function ImprovementProofUploader() {
  const [proofs, setProofs] = useState<ImprovementProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState("");
  const [beforeMark, setBeforeMark] = useState("");
  const [afterMark, setAfterMark] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    listMyImprovementProofs()
      .then(setProofs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      setError("That file is too large — please attach one under 5MB.");
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Attach a report card or marks document.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await uploadImprovementProof({ studentName, subject, beforeMark, afterMark }, file);
      setStudentName("");
      setSubject("");
      setBeforeMark("");
      setAfterMark("");
      setFile(null);
      setLoading(true);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Proof of improvement</h2>
      <p className="mt-1 text-sm text-ink-500">
        Show how much a past student improved under you. An admin reviews it privately — the document is never
        shown to students, only a verified badge with the subject and marks (e.g. &ldquo;Maths: 45% &rarr;
        72%&rdquo;).
      </p>
      <p className="mt-2 text-xs text-ink-300">
        Only upload a report card if you have the family&apos;s permission to share it with Lumen for this purpose.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Student's name" htmlFor="proof-student">
          <input
            id="proof-student"
            required
            className={inputClass}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </Field>
        <Field label="Subject" htmlFor="proof-subject">
          <input
            id="proof-subject"
            required
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <Field label="Mark before" htmlFor="proof-before" hint="e.g. 45% or D">
          <input
            id="proof-before"
            required
            className={inputClass}
            value={beforeMark}
            onChange={(e) => setBeforeMark(e.target.value)}
          />
        </Field>
        <Field label="Mark after" htmlFor="proof-after" hint="e.g. 72% or B">
          <input
            id="proof-after"
            required
            className={inputClass}
            value={afterMark}
            onChange={(e) => setAfterMark(e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handlePick} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className={buttonClass("outline")}>
            {file ? `Selected: ${file.name}` : "Attach report card"}
          </button>
        </div>

        {error && (
          <div className="sm:col-span-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}

        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className={buttonClass("primary")}>
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </form>

      {!loading && proofs.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-ink-700/8 pt-4">
          {proofs.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-700/5 px-3 py-2 text-sm">
              <span className="text-ink-700">
                {p.subject}: {p.beforeMark} &rarr; {p.afterMark}{" "}
                <span className="text-ink-300">({p.studentName})</span>
              </span>
              {p.verified ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
              ) : (
                <span className="font-semibold text-gold-600">Pending review</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
