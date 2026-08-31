"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register, ApiError, type CurrentUser } from "@/lib/api";

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

      router.push(PORTAL_ROOT[user.role]);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingConsentLink) {
    return (
      <main>
        <h1>Almost there</h1>
        <p>
          Your account needs a parent/guardian to consent before you can use the platform. We&apos;ve
          sent them a link to review and approve.
        </p>
        <p>
          <strong>Dev mode:</strong> no email provider is wired up yet, so here&apos;s the link
          directly —{" "}
          <a href={pendingConsentLink}>{pendingConsentLink}</a>
        </p>
        <button type="button" onClick={() => pendingRole && router.push(PORTAL_ROOT[pendingRole])}>
          Continue to my account
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="role">I am a</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as "STUDENT" | "TUTOR")}>
            <option value="STUDENT">Student</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </div>
        {role === "STUDENT" && (
          <div>
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
        )}
        {isMinorStudent && (
          <fieldset>
            <legend>
              Since you&apos;re under 18, a parent or guardian needs to consent before you can use
              the platform.
            </legend>
            <div>
              <label htmlFor="guardianName">Guardian&apos;s name</label>
              <input
                id="guardianName"
                required
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="guardianEmail">Guardian&apos;s email</label>
              <input
                id="guardianEmail"
                type="email"
                required
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
            </div>
          </fieldset>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}
