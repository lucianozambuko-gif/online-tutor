"use client";

import { useState, type FormEvent } from "react";
import { changePassword, ApiError } from "@/lib/api";
import { Field, inputClass, buttonClass, ErrorText } from "@/components/ui";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Current password" htmlFor="current-password">
        <input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>
      <Field label="New password" htmlFor="new-password" hint="At least 8 characters.">
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm-password">
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Saving..." : "Change password"}
        </button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Password updated.</span>}
      </div>
    </form>
  );
}
