"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getTutorDashboard,
  getOwnTutorProfile,
  ApiError,
  type TutorDashboardSummary,
  type VerificationStatus,
} from "@/lib/api";
import { ErrorText } from "@/components/ui";

function RequestsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function StudentsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
    </svg>
  );
}

function SessionsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function EarningsIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15V9.5a2.5 2.5 0 0 1 2.5-2.5h1a2 2 0 0 1 0 4h-1.5" />
      <path d="M9.5 13.5h3.7" />
    </svg>
  );
}

export function TutorOverview({ tutorName }: { tutorName: string }) {
  const [data, setData] = useState<TutorDashboardSummary | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    getTutorDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard."));
  }

  useEffect(load, []);
  useEffect(() => {
    getOwnTutorProfile()
      .then((profile) => setVerificationStatus(profile.verificationStatus))
      .catch(() => {});
  }, []);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <p className="text-sm text-ink-500">Loading your dashboard...</p>;

  const cards = [
    {
      label: "Pending requests",
      value: data.requests.count,
      icon: <RequestsIcon color="var(--color-gold-600)" />,
      iconBg: "bg-gold-300/35",
      href: "/tutor/requests",
    },
    {
      label: "Active students",
      value: data.students.count,
      icon: <StudentsIcon color="var(--color-sky-700)" />,
      iconBg: "bg-sky-100",
      href: "/tutor/students",
    },
    {
      label: "Upcoming sessions",
      value: data.sessions.count,
      icon: <SessionsIcon color="var(--color-ink-700)" />,
      iconBg: "bg-ink-700/6",
      href: "/tutor/sessions",
    },
    {
      label: "Earnings this month",
      value: `R${data.earnings.thisMonth.toFixed(2)}`,
      icon: <EarningsIcon color="var(--color-sky-700)" />,
      iconBg: "bg-sky-200",
      href: "/tutor/earnings",
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900">Hello, {tutorName}</h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening with your students today.</p>
      </div>

      {verificationStatus === "PENDING" && (
        <div className="rounded-2xl border border-gold-400/30 bg-gold-300/10 p-5 text-sm text-ink-700">
          Your profile is awaiting admin approval — you won&apos;t appear in student searches or be
          bookable until then.{" "}
          <Link href="/tutor/profile" className="font-semibold text-sky-700 hover:text-sky-600">
            View profile
          </Link>
        </div>
      )}
      {verificationStatus === "REJECTED" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          Your tutor application wasn&apos;t approved, so you won&apos;t be bookable.{" "}
          <Link href="/tutor/profile" className="font-semibold underline">
            View profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm transition hover:border-sky-400/50 hover:shadow-md"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>{card.icon}</div>
            <p className="mt-4 font-display text-[28px] font-bold text-ink-900">{card.value}</p>
            <p className="mt-0.5 text-[13px] text-ink-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
