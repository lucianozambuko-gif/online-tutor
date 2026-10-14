"use client";

import { BookingsList } from "@/components/bookings-list";
import { DashboardOverview } from "@/components/dashboard-overview";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboard() {
  const { user, loading } = useAuth();

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

      <div id="my-bookings">
        <BookingsList role="STUDENT" />
      </div>
    </div>
  );
}
