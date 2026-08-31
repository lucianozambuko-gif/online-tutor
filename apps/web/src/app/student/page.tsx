"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal-header";
import { BookTutorForm } from "@/components/book-tutor-form";
import { BookingsList } from "@/components/bookings-list";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main>
      <PortalHeader title="Student dashboard" />
      {!loading && user?.status === "PENDING_GUARDIAN_CONSENT" && (
        <p>
          Your account is waiting on a parent/guardian to consent before you can book sessions.
          Ask them to check their email for the consent link we sent them.
        </p>
      )}
      {!loading && user?.status === "ACTIVE" && (
        <>
          <BookTutorForm onBooked={() => setRefreshKey((k) => k + 1)} />
          <BookingsList key={refreshKey} role="STUDENT" />
        </>
      )}
    </main>
  );
}
