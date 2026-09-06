import Link from "next/link";
import { buttonClass } from "@/components/ui";

interface Lesson {
  id: string;
  subject: string;
  scheduledAt: string;
  tutor: { name: string };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function isToday(date: Date) {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday(date)) return `Today, ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: "short" })}, ${time}`;
}

const AVATAR_TONES = [
  { bg: "#e2f0fb", color: "#1f5f9c" },
  { bg: "rgba(18,35,59,0.06)", color: "#12233b" },
  { bg: "#c9e3f7", color: "#1f5f9c" },
];

export function UpcomingLessonsCard({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-ink-900">Upcoming lessons</p>
        <a href="#my-bookings" className="text-xs font-semibold text-sky-700 hover:text-sky-600">
          View all
        </a>
      </div>

      {lessons.length === 0 ? (
        <p className="mt-4 flex-1 text-sm text-ink-300">No lessons booked yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {lessons.map((lesson, i) => {
            const soonest = i === 0 && isToday(new Date(lesson.scheduledAt));
            const tone = AVATAR_TONES[i % AVATAR_TONES.length];
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-sky-400/50 ${
                  soonest ? "border-gold-400/50 bg-gold-300/[0.18]" : "border-ink-700/8"
                }`}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: soonest ? "#ddb75c" : tone.bg }}
                >
                  <span className="font-display text-[13px] font-bold" style={{ color: soonest ? "#0d1b2e" : tone.color }}>
                    {initials(lesson.tutor.name)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{lesson.subject}</p>
                  <p className="truncate text-xs text-ink-500">with {lesson.tutor.name}</p>
                </div>
                {soonest ? (
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-gold-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {formatWhen(lesson.scheduledAt)}
                  </span>
                ) : (
                  <span className="shrink-0 whitespace-nowrap text-xs text-ink-500">{formatWhen(lesson.scheduledAt)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link href="#book-a-tutor" className={buttonClass("primary", "mt-5 w-full")}>
        Book another lesson
      </Link>
    </div>
  );
}
