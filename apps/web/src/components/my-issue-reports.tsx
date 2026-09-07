"use client";

import { useEffect, useState } from "react";
import { listMyIssueReports, ApiError, type IssueReport } from "@/lib/api";
import { Card, ErrorText, StatusBadge } from "@/components/ui";

const CATEGORY_LABEL: Record<IssueReport["category"], string> = {
  BOOKING: "Booking",
  PAYMENT: "Payment",
  TECHNICAL: "Technical",
  ACCOUNT: "Account",
  OTHER: "Other",
};

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function MyIssueReports({ refreshKey }: { refreshKey: number }) {
  const [issues, setIssues] = useState<IssueReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyIssueReports()
      .then(setIssues)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your reports."));
  }, [refreshKey]);

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Your reports</h2>
      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      {!issues ? (
        <p className="mt-4 text-sm text-ink-500">Loading...</p>
      ) : issues.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">You haven&apos;t reported anything yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-xl border border-ink-700/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{issue.subject}</p>
                <StatusBadge status={issue.status} />
              </div>
              <p className="mt-1 text-xs text-ink-300">
                {CATEGORY_LABEL[issue.category]} · {timeAgo(issue.createdAt)}
              </p>
              <p className="mt-2 text-sm text-ink-700">{issue.description}</p>
              {issue.adminNotes && (
                <div className="mt-3 rounded-lg bg-cream-soft p-3 text-sm text-ink-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Admin response</p>
                  <p className="mt-1">{issue.adminNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
