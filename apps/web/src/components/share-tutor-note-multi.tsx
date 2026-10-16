"use client";

import { useEffect, useState } from "react";
import { listTutorStudents, ApiError, type RosterEntry } from "@/lib/api";
import { buttonClass, ErrorText } from "@/components/ui";

export function ShareTutorNoteMulti({
  onShare,
}: {
  onShare: (studentIds: string[]) => Promise<{ sent: string[]; skipped: string[] }>;
}) {
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [result, setResult] = useState<{ sent: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTutorStudents()
      .then(setRoster)
      .catch(() => setRoster([]));
  }, []);

  function toggle(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  async function handleShare() {
    if (selected.size === 0) return;
    setSharing(true);
    setError(null);
    setResult(null);
    try {
      const res = await onShare([...selected]);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't share this note");
    } finally {
      setSharing(false);
    }
  }

  if (!roster) return <p className="text-sm text-ink-500">Loading your students...</p>;
  if (roster.length === 0) return <p className="text-sm text-ink-300">No students have booked you yet.</p>;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {roster.map((entry) => (
          <label key={entry.student.id} className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={selected.has(entry.student.id)}
              onChange={() => toggle(entry.student.id)}
              className="h-4 w-4 rounded border-ink-700/25 text-sky-600 focus:ring-sky-400/30"
            />
            {entry.student.name}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing || selected.size === 0}
        className={buttonClass("outline", "mt-3")}
      >
        {sharing ? "Sharing..." : `Share with ${selected.size || ""} student${selected.size === 1 ? "" : "s"}`.trim()}
      </button>

      {result && (
        <p className="mt-2 text-sm">
          {result.sent.length > 0 && <span className="text-emerald-600">Sent to {result.sent.length}. </span>}
          {result.skipped.length > 0 && (
            <span className="text-ink-300">{result.skipped.length} skipped (no active session with them).</span>
          )}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
