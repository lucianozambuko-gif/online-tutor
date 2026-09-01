import { TutorProfileForm } from "@/components/tutor-profile-form";
import { BookingsList } from "@/components/bookings-list";

export default function TutorDashboard() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
          Tutor dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">Manage your profile and respond to bookings.</p>
      </div>

      <TutorProfileForm />
      <BookingsList role="TUTOR" />
    </div>
  );
}
