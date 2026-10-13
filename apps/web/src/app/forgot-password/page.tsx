"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      // Always show the same success state, whether or not the email is
      // registered — matches the API's own enumeration-safe response.
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists for that address, we've sent a reset link.">
        <p className="text-center text-sm text-ink-500">
          The link expires in 1 hour.{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Back to log in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full")}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
