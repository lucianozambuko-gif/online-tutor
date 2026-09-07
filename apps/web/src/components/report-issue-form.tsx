"use client";

import { useState, type FormEvent } from "react";
import { createIssueReport, ApiError, type IssueCategory, type IssueReport } from "@/lib/api";
import { Card, Field, inputClass, labelClass, buttonClass, ErrorText } from "@/components/ui";

const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: "BOOKING", label: "A booking or session" },
  { value: "PAYMENT", label: "Payment or payout" },
  { value: "TECHNICAL", label: "Something's broken" },
  { value: "ACCOUNT", label: "My account" },
  { value: "OTHER", label: "Something else" },
];

export function ReportIssueForm({ onCreated }: { onCreated: (issue: IssueReport) => void }) {
  const [category, setCategory] = useState<IssueCategory>("OTHER");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const issue = await createIssueReport({ category, subject, description });
      setSubject("");
      setDescription("");
      setCategory("OTHER");
      onCreated(issue);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong submitting your report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Report an issue</h2>
      <p className="mt-1 text-sm text-ink-500">
        Tell us what went wrong — an admin will follow up on this.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <Field label="What's this about?" htmlFor="issue-category">
          <select
            id="issue-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subject" htmlFor="issue-subject">
          <input
            id="issue-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={3}
            maxLength={150}
            placeholder="A short summary"
            className={inputClass}
          />
        </Field>

        <div className="space-y-1.5">
          <label htmlFor="issue-description" className={labelClass}>
            What happened?
          </label>
          <textarea
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="As much detail as you can share — when it happened, what you expected, what happened instead."
            className={`${inputClass} resize-y`}
          />
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full sm:w-auto")}>
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </Card>
  );
}
