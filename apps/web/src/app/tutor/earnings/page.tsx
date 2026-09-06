"use client";

import { useEffect, useState } from "react";
import { getMyPayoutSummary, ApiError, type Payout } from "@/lib/api";
import { Card, ErrorText, StatusBadge } from "@/components/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TutorEarningsPage() {
  const [data, setData] = useState<{ pendingAmount: number; lifetimePaid: number; payouts: Payout[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyPayoutSummary()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your earnings."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Earnings</h1>
        <p className="mt-1 text-sm text-ink-500">Your payout balance and history.</p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {!data ? (
        <p className="text-sm text-ink-500">Loading your earnings...</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-300">Awaiting payout</p>
              <p className="mt-2 font-display text-3xl font-bold text-ink-900">R{data.pendingAmount.toFixed(2)}</p>
              <p className="mt-1 text-xs text-ink-500">
                From completed, paid sessions not yet included in a payout batch.
              </p>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-300">Lifetime paid out</p>
              <p className="mt-2 font-display text-3xl font-bold text-ink-900">R{data.lifetimePaid.toFixed(2)}</p>
              <p className="mt-1 text-xs text-ink-500">Total across all completed payouts.</p>
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-lg font-semibold text-ink-900">Payout history</h2>
            {data.payouts.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">
                No payouts yet — Lumen batches completed sessions into a payout periodically.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.payouts.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-700/10 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {p.payoutMethod}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-semibold text-ink-900">R{Number(p.totalAmount).toFixed(2)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
