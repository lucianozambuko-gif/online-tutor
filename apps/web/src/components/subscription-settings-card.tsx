"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySubscription, cancelSubscription, ApiError, type SubscriptionSummary } from "@/lib/api";
import { buttonClass, ErrorText, StatusBadge } from "@/components/ui";
import { formatResetIn } from "@/lib/format";

export function SubscriptionSettingsCard() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    getMySubscription()
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your subscription."));
  }

  useEffect(load, []);

  async function handleCancel() {
    if (!window.confirm("Cancel your subscription? You'll keep your plan until the end of the current period.")) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelSubscription();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong cancelling.");
    } finally {
      setCancelling(false);
    }
  }

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!summary) return <p className="text-sm text-ink-500">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-lg font-semibold text-ink-900">{summary.plan}</span>
          <StatusBadge status={summary.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/student/subscription" className={buttonClass("outline", "px-4 py-2 text-xs")}>
            {summary.plan === "FREE" ? "View plans" : "Change plan"}
          </Link>
          {summary.plan !== "FREE" && summary.status === "ACTIVE" && (
            <button type="button" onClick={handleCancel} disabled={cancelling} className={buttonClass("danger", "px-4 py-2 text-xs")}>
              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          )}
        </div>
      </div>
      {summary.status === "CANCELLED" && summary.periodEnd && (
        <p className="mt-2 text-xs text-ink-300">
          Cancelled — you&apos;ll move to Free after {new Date(summary.periodEnd).toLocaleDateString()}.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-300">
        {summary.aiMessagesUsed}
        {summary.aiMessagesLimit !== null ? `/${summary.aiMessagesLimit}` : ""} AI Helper messages
        {summary.plan === "FREE"
          ? summary.aiMessagesResetAt
            ? ` (resets in ${formatResetIn(summary.aiMessagesResetAt)})`
            : ""
          : " this month"}{" "}
        · {summary.generationsUsed}
        {summary.generationsLimit !== null ? `/${summary.generationsLimit}` : ""} generations this month
      </p>
    </div>
  );
}
