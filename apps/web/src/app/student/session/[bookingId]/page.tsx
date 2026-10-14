"use client";

import { use } from "react";
import { JaasMeeting } from "@/components/jaas-meeting";

export default function StudentSessionPage({ params }: PageProps<"/student/session/[bookingId]">) {
  const { bookingId } = use(params);
  return <JaasMeeting bookingId={bookingId} backHref="/student" />;
}
