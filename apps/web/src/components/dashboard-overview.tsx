"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudentDashboard, ApiError, type DashboardSummary } from "@/lib/api";
import { ErrorText } from "@/components/ui";
import { StatCards } from "@/components/stat-cards";
import { StudyActivityChart, type DayActivity } from "@/components/study-activity-chart";
import { UpcomingLessonsCard } from "@/components/upcoming-lessons-card";
import { RecentActivityTable, type RecentItem } from "@/components/recent-activity-table";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d1b2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.4 4.3L18 8.7l-4.6 1.4L12 14.4l-1.4-4.3L6 8.7l4.6-1.4z" />
    </svg>
  );
}

function buildDayBuckets(data: DashboardSummary): DayActivity[] {
  const events = [
    ...data.notes.recent.map((n) => n.createdAt),
    ...data.flashcards.recent.map((f) => f.createdAt),
    ...data.quizzes.recent.map((q) => q.createdAt),
  ];

  const days: DayActivity[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const count = events.filter((iso) => {
      const eventDate = new Date(iso);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    }).length;
    days.push({ label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count });
  }
  return days;
}

function buildRecentItems(data: DashboardSummary): RecentItem[] {
  const items: RecentItem[] = [
    ...data.notes.recent.map((n) => ({
      id: n.id,
      title: n.topic,
      subject: n.subject,
      type: "Note" as const,
      createdAt: n.createdAt,
      href: `/student/notes/${n.id}`,
      result: "—",
    })),
    ...data.flashcards.recent.map((f) => ({
      id: f.id,
      title: f.topic,
      subject: null,
      type: "Flashcards" as const,
      createdAt: f.createdAt,
      href: `/student/flashcards/${f.id}`,
      result: `${f._count.cards} cards`,
    })),
    ...data.quizzes.recent.map((q) => ({
      id: q.id,
      title: q.topic,
      subject: null,
      type: "Quiz" as const,
      createdAt: q.createdAt,
      href: `/student/quizzes/${q.id}`,
      result: q.attempted ? `Scored ${q.score}/${q.totalQuestions}` : "Not attempted",
    })),
  ];
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function DashboardOverview({ studentName }: { studentName: string }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStudentDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard."));
  }, []);

  const days = useMemo(() => (data ? buildDayBuckets(data) : []), [data]);
  const recentItems = useMemo(() => (data ? buildRecentItems(data) : []), [data]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <p className="text-sm text-ink-500">Loading your dashboard...</p>;

  const attemptedRecent = data.quizzes.recent.filter((q) => q.attempted && q.totalQuestions);
  const quizTrend =
    attemptedRecent.length > 0
      ? `Recent avg ${Math.round(
          (attemptedRecent.reduce((sum, q) => sum + (q.score ?? 0) / (q.totalQuestions ?? 1), 0) / attemptedRecent.length) * 100,
        )}%`
      : data.quizzes.count === 0
        ? "Take your first quiz"
        : "Attempt a quiz to see your score";

  const nextLesson = data.lessons.upcoming[0] ?? null;
  const nextLessonLabel = nextLesson
    ? `Next: ${new Date(nextLesson.scheduledAt).toLocaleDateString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`
    : null;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900">Hello, {studentName}</h1>
          <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening with your studies today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes, flashcards, quizzes..."
              className="w-[280px] rounded-lg border border-ink-700/15 bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-ink-900 shadow-sm outline-none transition placeholder:text-ink-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
            />
          </div>
          <a
            href="#ai-helper"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 text-[13px] font-semibold text-ink-900 shadow-sm transition hover:shadow-md hover:shadow-gold-500/20"
          >
            <SparkleIcon />
            Ask Lumen AI
          </a>
        </div>
      </div>

      <StatCards
        notesCount={data.notes.count}
        flashcardsCount={data.flashcards.count}
        quizzesCount={data.quizzes.count}
        quizTrend={quizTrend}
        upcomingCount={data.lessons.count}
        nextLessonLabel={nextLessonLabel}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="rounded-2xl border border-ink-700/10 bg-white p-7 shadow-sm lg:flex-[0_0_62%]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-ink-900">Study activity</p>
              <p className="mt-0.5 text-xs text-ink-300">Notes, flashcards and quizzes created, last 14 days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-600" />
              <span className="text-xs text-ink-500">Items created</span>
            </div>
          </div>
          <StudyActivityChart days={days} />
        </div>

        <UpcomingLessonsCard lessons={data.lessons.upcoming} />
      </div>

      <RecentActivityTable items={recentItems} search={search} />
    </div>
  );
}
