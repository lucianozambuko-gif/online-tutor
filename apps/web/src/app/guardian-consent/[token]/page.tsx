"use client";

import { use, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { buttonClass, ErrorText } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ConsentDetails {
  studentName: string;
  guardianName: string;
  guardianEmail: string;
  status: "PENDING" | "CONSENTED" | "EXPIRED";
  expiresAt: string;
}

export default function GuardianConsentPage({ params }: PageProps<"/guardian-consent/[token]">) {
  const { token } = use(params);
  const [details, setDetails] = useState<ConsentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/guardian-consent/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("This consent link is invalid.");
        return res.json();
      })
      .then(setDetails)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/guardian-consent/${token}/accept`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Something went wrong");
      }
      setAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthShell title="Guardian consent">
        <p className="text-sm text-ink-500">Loading...</p>
      </AuthShell>
    );
  }

  if (error && !details) {
    return (
      <AuthShell title="Guardian consent">
        <ErrorText>{error}</ErrorText>
      </AuthShell>
    );
  }

  if (!details) return null;

  if (accepted || details.status === "CONSENTED") {
    return (
      <AuthShell title="Consent recorded">
        <p className="text-sm leading-relaxed text-ink-500">
          Thank you — you&apos;ve given consent for <strong className="text-ink-900">{details.studentName}</strong>{" "}
          to use the platform. They can now sign in normally.
        </p>
      </AuthShell>
    );
  }

  if (details.status === "EXPIRED") {
    return (
      <AuthShell title="Link expired">
        <p className="text-sm leading-relaxed text-ink-500">
          This consent link has expired. Please ask {details.studentName} to register again.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Guardian consent" wide>
      <p className="text-sm leading-relaxed text-ink-500">
        <strong className="text-ink-900">{details.studentName}</strong> has registered as a student
        on this platform and is under 18. As their parent/guardian ({details.guardianName}), your
        consent is required before they can use it.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-500">
        By consenting, you confirm you are {details.studentName}&apos;s parent or legal guardian,
        you agree to the platform&apos;s safeguarding policy, and you understand that in-app
        messages between {details.studentName} and their tutor are logged and may be reviewed by
        platform admins for safeguarding purposes.
      </p>
      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <button type="button" onClick={handleAccept} disabled={submitting} className={buttonClass("primary", "mt-6 w-full")}>
        {submitting ? "Submitting..." : "I consent"}
      </button>
    </AuthShell>
  );
}
