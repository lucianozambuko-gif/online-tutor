"use client";

import { useEffect, useState } from "react";
import { getTutorBusySlots, ApiError, type TutorBusySlot } from "@/lib/api";
import { Card, ErrorText } from "@/components/ui";

function groupByDate(slots: TutorBusySlot[]) {
  const groups = new Map<string, TutorBusySlot[]>();
  for (const slot of slots) {
    const key = new Date(slot.scheduledAt).toDateString();
    const existing = groups.get(key);
    if (existing) existing.push(slot);
    else groups.set(key, [slot]);
  }
  return [...groups.entries()];
}

function formatTimeRange(slot: TutorBusySlot) {
  const start = new Date(slot.scheduledAt);
  const end = new Date(start.getTime() + slot.durationMinutes * 60_000);
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function TutorBusySlots({ tutorId }: { tutorId: string }) {
  const [slots, setSlots] = useState<TutorBusySlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTutorBusySlots(tutorId)
      .then(setSlots)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this tutor's schedule"));
  }, [tutorId]);

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink-900">Already booked</h2>
      <p className="mt-1 text-sm text-ink-500">These times are taken — pick something outside them.</p>

      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {!error && slots === null ? (
        <p className="mt-4 text-sm text-ink-500">Loading...</p>
      ) : !error && slots!.length === 0 ? (
        <p className="mt-4 text-sm text-ink-300">No upcoming bookings — this tutor is wide open.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {groupByDate(slots ?? []).map(([dateKey, daySlots]) => (
            <li key={dateKey}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                {new Date(dateKey).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <ul className="mt-1.5 space-y-1">
                {daySlots.map((slot, i) => (
                  <li key={i} className="rounded-lg bg-ink-700/5 px-3 py-1.5 text-sm text-ink-700">
                    {formatTimeRange(slot)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
