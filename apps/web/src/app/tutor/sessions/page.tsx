import { BookingsList } from "@/components/bookings-list";

export default function TutorSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Sessions</h1>
        <p className="mt-1 text-sm text-ink-500">Your full booking schedule.</p>
      </div>
      <BookingsList role="TUTOR" />
    </div>
  );
}
