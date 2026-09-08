"use client";

import { useRef, useState } from "react";
import { uploadAvatar, removeAvatar, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buttonClass, ErrorText } from "@/components/ui";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function AvatarUploader() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError("That image is too large — please pick one under 5MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await uploadAvatar(file);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await removeAvatar();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100">
          <span className="font-display text-2xl font-semibold text-sky-700">{initials(user.name)}</span>
        </div>
      )}

      <div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className={buttonClass("outline", "text-sm")}>
            {busy ? "Working..." : user.avatarUrl ? "Change photo" : "Add photo"}
          </button>
          {user.avatarUrl && (
            <button type="button" disabled={busy} onClick={handleRemove} className={buttonClass("ghost", "text-sm")}>
              Remove
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-300">JPG, PNG, WEBP or GIF, up to 5MB.</p>
        {error && (
          <div className="mt-2">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </div>
    </div>
  );
}
