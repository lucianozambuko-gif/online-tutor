import { PortalHeader } from "@/components/portal-header";
import { TutorProfileForm } from "@/components/tutor-profile-form";
import { BookingsList } from "@/components/bookings-list";

export default function TutorDashboard() {
  return (
    <main>
      <PortalHeader title="Tutor dashboard" />
      <TutorProfileForm />
      <BookingsList role="TUTOR" />
    </main>
  );
}
