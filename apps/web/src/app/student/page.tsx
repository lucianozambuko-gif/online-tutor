"use client";

import { useState } from "react";
import { BookTutorForm } from "@/components/book-tutor-form";
import { BookingsList } from "@/components/bookings-list";
import { AiHelperChat } from "@/components/ai-helper-chat";
import { DashboardOverview } from "@/components/dashboard-overview";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading || !user) {
    return <p className="text-sm text-ink-500">Loading your dashboard...</p>;
  }

  if (user.status === "PENDING_GUARDIAN_CONSENT") {
    return (
      <div className="rounded-2xl border border-gold-400/30 bg-gold-300/10 p-6 text-sm text-ink-700">
        Your account is waiting on a parent/guardian to consent before you can book sessions. Ask them
        to check their email for the consent link we sent them.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <DashboardOverview studentName={user.name.split(" ")[0]} />

      <div id="ai-helper">
        <AiHelperChat />
      </div>
      <div id="book-a-tutor">
        <BookTutorForm onBooked={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div id="my-bookings">
        <BookingsList key={refreshKey} role="STUDENT" />
      </div>
    </div>
  );
}
