import type { ReactNode } from "react";

interface StatCard {
  label: string;
  value: string | number;
  trend: string;
  trendColor: string;
  iconBg: string;
  iconColor: string;
  icon: ReactNode;
}

function NotesIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6z" />
      <path d="M15 2v3h3" />
      <path d="M9 11h6M9 15h6M9 19h3" />
    </svg>
  );
}

function FlashcardsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="14" height="10" rx="2" />
      <path d="M7.5 8V5.5A1.5 1.5 0 0 1 9 4h10a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
    </svg>
  );
}

function QuizIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3L15.5 9.5" />
    </svg>
  );
}

function LessonsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function StatCards({
  notesCount,
  flashcardsCount,
  quizzesCount,
  quizTrend,
  upcomingCount,
  nextLessonLabel,
}: {
  notesCount: number;
  flashcardsCount: number;
  quizzesCount: number;
  quizTrend: string;
  upcomingCount: number;
  nextLessonLabel: string | null;
}) {
  const cards: StatCard[] = [
    {
      label: "Notes generated",
      value: notesCount,
      trend: notesCount === 0 ? "Generate your first note" : "Keep building your library",
      trendColor: "text-sky-600",
      iconBg: "bg-sky-100",
      iconColor: "#1f5f9c",
      icon: <NotesIcon color="#1f5f9c" />,
    },
    {
      label: "Flashcard sets",
      value: flashcardsCount,
      trend: flashcardsCount === 0 ? "Turn a note into flashcards" : "Review them before your next quiz",
      trendColor: "text-gold-600",
      iconBg: "bg-gold-300/35",
      iconColor: "#a97e26",
      icon: <FlashcardsIcon color="#a97e26" />,
    },
    {
      label: "Quizzes taken",
      value: quizzesCount,
      trend: quizTrend,
      trendColor: "text-ink-500",
      iconBg: "bg-ink-700/6",
      iconColor: "#12233b",
      icon: <QuizIcon color="#12233b" />,
    },
    {
      label: "Upcoming lessons",
      value: upcomingCount,
      trend: nextLessonLabel ?? "Nothing booked yet",
      trendColor: "text-gold-600",
      iconBg: "bg-sky-200",
      iconColor: "#1f5f9c",
      icon: <LessonsIcon color="#1f5f9c" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm transition hover:border-sky-400/50 hover:shadow-md"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>{card.icon}</div>
          <p className="mt-4 font-display text-[28px] font-bold text-ink-900">{card.value}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">{card.label}</p>
          <p className={`mt-2 text-xs font-medium ${card.trendColor}`}>{card.trend}</p>
        </div>
      ))}
    </div>
  );
}
