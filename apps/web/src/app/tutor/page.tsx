"use client";

import { TutorOverview } from "@/components/tutor-overview";
import { useAuth } from "@/lib/auth-context";

export default function TutorDashboard() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <p className="text-sm text-ink-500">Loading your dashboard...</p>;
  }

  return <TutorOverview tutorName={user.name.split(" ")[0]} />;
}
