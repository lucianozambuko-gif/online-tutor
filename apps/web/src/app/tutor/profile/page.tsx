"use client";

import { useEffect, useState } from "react";
import { getOwnTutorProfile, ApiError, type OwnTutorProfile } from "@/lib/api";
import { TutorProfileForm } from "@/components/tutor-profile-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { TranscriptUploader } from "@/components/transcript-uploader";
import { ImprovementProofUploader } from "@/components/improvement-proof-uploader";
import { BankDetailsForm } from "@/components/bank-details-form";
import { TutorReviewsCard } from "@/components/tutor-reviews-card";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

function VerificationBanner({ status }: { status: OwnTutorProfile["verificationStatus"] }) {
  if (status === "APPROVED") return null;

  if (status === "REJECTED") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
        Your tutor application wasn&apos;t approved, so you won&apos;t appear in student searches or be
        bookable. Contact an admin if you think this is a mistake.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold-400/30 bg-gold-300/10 p-5 text-sm text-ink-700">
      Your profile is awaiting admin approval — you won&apos;t appear in student searches or be
      bookable until then. This is usually quick; check back soon.
    </div>
  );
}

export default function TutorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OwnTutorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOwnTutorProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your profile status."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Keep your subjects, rate and bio up to date.</p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {profile && <VerificationBanner status={profile.verificationStatus} />}
      <Card>
        <AvatarUploader />
      </Card>
      {profile ? (
        <>
          <TutorProfileForm initial={profile} />
          <BankDetailsForm initial={profile} />
          <TranscriptUploader initial={profile} />
          <ImprovementProofUploader />
          {user && <TutorReviewsCard tutorId={user.id} />}
        </>
      ) : (
        <p className="text-sm text-ink-500">Loading your profile...</p>
      )}
    </div>
  );
}
