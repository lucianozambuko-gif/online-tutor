"use client";

import { useState } from "react";
import { BookTutorForm } from "@/components/book-tutor-form";
import { BookingsList } from "@/components/bookings-list";
import { AiHelperChat } from "@/components/ai-helper-chat";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
          Student dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">Book sessions and keep track of your tutors.</p>
      </div>

      {!loading && user?.status === "PENDING_GUARDIAN_CONSENT" && (
        <div className="rounded-2xl border border-gold-400/30 bg-gold-300/10 p-6 text-sm text-ink-700">
          Your account is waiting on a parent/guardian to consent before you can book sessions. Ask
          them to check their email for the consent link we sent them.
        </div>
      )}

      {!loading && user?.status === "ACTIVE" && (
        <>
          <AiHelperChat />
          <BookTutorForm onBooked={() => setRefreshKey((k) => k + 1)} />
          <BookingsList key={refreshKey} role="STUDENT" />
        </>
      )}
    </div>
  );
}
