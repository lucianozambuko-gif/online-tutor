"use client";

import { useState } from "react";
import { deleteOwnAccount, ApiError } from "@/lib/api";
import { buttonClass, ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export function DangerZone() {
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete your account? This deactivates it immediately and can't be undone by you — an admin would need to restore it.",
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await deleteOwnAccount();
      await logout();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-500">
        Deleting your account deactivates it immediately — you&apos;ll be logged out, and won&apos;t be
        able to log back in.
      </p>
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <button type="button" onClick={handleDelete} disabled={deleting} className={buttonClass("danger", "mt-4")}>
        {deleting ? "Deleting..." : "Delete my account"}
      </button>
    </div>
  );
}
