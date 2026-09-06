import { TutorProfileForm } from "@/components/tutor-profile-form";

export default function TutorProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Keep your subjects, rate and bio up to date.</p>
      </div>
      <TutorProfileForm />
    </div>
  );
}
