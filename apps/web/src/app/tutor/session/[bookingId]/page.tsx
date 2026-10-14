"use client";

import { use } from "react";
import { JaasMeeting } from "@/components/jaas-meeting";

export default function TutorSessionPage({ params }: PageProps<"/tutor/session/[bookingId]">) {
  const { bookingId } = use(params);
  return <JaasMeeting bookingId={bookingId} backHref="/tutor/sessions" />;
}
