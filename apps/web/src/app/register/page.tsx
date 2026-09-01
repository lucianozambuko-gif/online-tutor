"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, ApiError, type CurrentUser } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, buttonClass, ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

const PORTAL_ROOT = { STUDENT: "/student", TUTOR: "/tutor", ADMIN: "/admin" } as const;

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TUTOR">("STUDENT");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingConsentLink, setPendingConsentLink] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<CurrentUser["role"] | null>(null);

  const age = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);
  const isMinorStudent = role === "STUDENT" && age !== null && age < 18;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { user, guardianConsentLink } = await register({
        name,
        email,
        password,
        role,
        dateOfBirth: role === "STUDENT" ? dateOfBirth : undefined,
        guardianName: isMinorStudent ? guardianName : undefined,
        guardianEmail: isMinorStudent ? guardianEmail : undefined,
      });

      if (guardianConsentLink) {
        setPendingConsentLink(guardianConsentLink);
        setPendingRole(user.role);
        return;
      }

      await refresh();
      router.push(PORTAL_ROOT[user.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingConsentLink) {
    return (
      <AuthShell title="Almost there" subtitle="Your guardian's consent is needed before you can start.">
        <p className="text-sm leading-relaxed text-ink-500">
          Your account needs a parent/guardian to consent before you can use the platform.
          We&apos;ve sent them a link to review and approve.
        </p>
        <div className="mt-4 rounded-lg border border-gold-400/30 bg-gold-300/10 p-4 text-sm">
          <p className="font-semibold text-gold-600">Dev mode</p>
          <p className="mt-1 text-ink-500">
            No email provider is wired up yet, so here&apos;s the link directly:
          </p>
          <a href={pendingConsentLink} className="mt-1 block break-all font-medium text-sky-700 hover:text-sky-800">
            {pendingConsentLink}
          </a>
        </div>
        <button
          type="button"
          onClick={async () => {
            await refresh();
            if (pendingRole) router.push(PORTAL_ROOT[pendingRole]);
          }}
          className={buttonClass("primary", "mt-6 w-full")}
        >
          Continue to my account
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Lumen as a student or tutor." wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name" htmlFor="name">
          <input id="name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
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
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
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
        <Field label="I am a" htmlFor="role">
          <select
            id="role"
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value as "STUDENT" | "TUTOR")}
          >
            <option value="STUDENT">Student</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </Field>
        {role === "STUDENT" && (
          <Field label="Date of birth" htmlFor="dob">
            <input
              id="dob"
              type="date"
              required
              className={inputClass}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Field>
        )}
        {isMinorStudent && (
          <fieldset className="space-y-4 rounded-xl border border-gold-400/30 bg-gold-300/10 p-4">
            <legend className="px-1 text-xs font-medium leading-relaxed text-gold-600">
              Since you&apos;re under 18, a parent or guardian needs to consent before you can use
              the platform.
            </legend>
            <Field label="Guardian's name" htmlFor="guardianName">
              <input
                id="guardianName"
                required
                className={inputClass}
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </Field>
            <Field label="Guardian's email" htmlFor="guardianEmail">
              <input
                id="guardianEmail"
                type="email"
                required
                className={inputClass}
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
            </Field>
          </fieldset>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={submitting} className={buttonClass("primary", "w-full")}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
