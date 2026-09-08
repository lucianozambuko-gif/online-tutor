"use client";

import { useRef, useState } from "react";
import { uploadTutorTranscript, ApiError, type OwnTutorProfile } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";

const MAX_TRANSCRIPT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";

export function TranscriptUploader({ initial }: { initial: OwnTutorProfile }) {
  const [transcriptName, setTranscriptName] = useState(initial.transcriptName);
  const [verified, setVerified] = useState(initial.transcriptVerified);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_TRANSCRIPT_BYTES) {
      setError("That file is too large — please attach one under 5MB.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const updated = await uploadTutorTranscript(file);
      setTranscriptName(updated.transcriptName);
      setVerified(updated.transcriptVerified);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Proof of marks (optional)</h2>
      <p className="mt-1 text-sm text-ink-500">
        Upload a transcript or report card for the subjects you tutor. An admin reviews it, and once verified,
        students see a &ldquo;Verified with transcript&rdquo; badge on your profile.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handlePick} className="hidden" />
        <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className={buttonClass("outline")}>
          {uploading ? "Uploading..." : transcriptName ? "Replace file" : "Upload file"}
        </button>
        {transcriptName && (
          <span className="text-sm text-ink-700">
            {transcriptName} —{" "}
            {verified ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
            ) : (
              <span className="font-semibold text-gold-600">Pending review</span>
            )}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  );
}
