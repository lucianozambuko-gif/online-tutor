"use client";

import { use, useEffect, useState } from "react";

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

  if (loading) return <main>Loading...</main>;
  if (error) return <main><p role="alert">{error}</p></main>;
  if (!details) return null;

  if (accepted || details.status === "CONSENTED") {
    return (
      <main>
        <h1>Consent recorded</h1>
        <p>
          Thank you — you&apos;ve given consent for {details.studentName} to use the platform. They
          can now sign in normally.
        </p>
      </main>
    );
  }

  if (details.status === "EXPIRED") {
    return (
      <main>
        <h1>Link expired</h1>
        <p>This consent link has expired. Please ask {details.studentName} to register again.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Guardian consent</h1>
      <p>
        {details.studentName} has registered as a student on this platform and is under 18. As
        their parent/guardian ({details.guardianName}), your consent is required before they can
        use it.
      </p>
      <p>
        By consenting, you confirm you are {details.studentName}&apos;s parent or legal guardian,
        you agree to the platform&apos;s safeguarding policy, and you understand that in-app
        messages between {details.studentName} and their tutor are logged and may be reviewed by
        platform admins for safeguarding purposes.
      </p>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={handleAccept} disabled={submitting}>
        {submitting ? "Submitting..." : "I consent"}
      </button>
    </main>
  );
}
