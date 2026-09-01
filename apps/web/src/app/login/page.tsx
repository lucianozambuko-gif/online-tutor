"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, buttonClass, ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

const PORTAL_ROOT = { STUDENT: "/student", TUTOR: "/tutor", ADMIN: "/admin" } as const;

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { user } = await login(email, password);
      await refresh();
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next ?? PORTAL_ROOT[user.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue to your dashboard.">
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
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full")}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-sky-700 hover:text-sky-800">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
