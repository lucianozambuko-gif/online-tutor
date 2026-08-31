"use client";

import { PortalHeader } from "@/components/portal-header";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboard() {
  const { user, loading } = useAuth();

  return (
    <main>
      <PortalHeader title="Student dashboard" />
      {!loading && user?.status === "PENDING_GUARDIAN_CONSENT" && (
        <p>
          Your account is waiting on a parent/guardian to consent before you can book sessions.
          Ask them to check their email for the consent link we sent them.
        </p>
      )}
    </main>
  );
}
