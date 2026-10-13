"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export default function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Password reset" subtitle="Redirecting you to log in...">
        <p className="text-center text-sm text-ink-500">
          Your password has been updated.{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Log in now
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Must be at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="New password" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full")}>
          {submitting ? "Saving..." : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}
