"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandMark } from "@/components/brand-mark";
import { getUnreadSummary } from "@/lib/api";

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6z" />
      <path d="M15 2v3h3" />
      <path d="M9 11h6M9 15h6M9 19h3" />
    </svg>
  );
}

function FlashcardsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="14" height="10" rx="2" />
      <path d="M7.5 8V5.5A1.5 1.5 0 0 1 9 4h10a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3L15.5 9.5" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.7-1.3-3.9-2-6-2v13.5c2.1 0 4.3.7 6 2 1.7-1.3 3.9-2 6-2V3.5c-2.1 0-4.3.7-6 2z" />
    </svg>
  );
}

function BookTutorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 13.5v5M9.5 16h5" />
    </svg>
  );
}

function MyBookingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M9.5 16l1.6 1.6L14.5 14" />
    </svg>
  );
}

function AiHelperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.4 4.3L18 8.7l-4.6 1.4L12 14.4l-1.4-4.3L6 8.7l4.6-1.4z" />
      <path d="M18.5 14.5l.6 1.8 1.9.6-1.9.6-.6 1.8-.6-1.8-1.9-.6 1.9-.6z" />
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 3 5-6 5 6 4-3-1.5 10h-15z" />
      <path d="M6.5 18h11" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" />
      <path d="M10.3 3.9 2.7 17.1a1.8 1.8 0 0 0 1.6 2.7h15.4a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  match: (pathname: string) => boolean;
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: <DashboardIcon />, match: (p) => p === "/student" },
  {
    label: "Notes",
    href: "/student/library?tab=notes",
    icon: <NotesIcon />,
    match: (p) => p.startsWith("/student/notes"),
  },
  {
    label: "Flashcards",
    href: "/student/library?tab=flashcards",
    icon: <FlashcardsIcon />,
    match: (p) => p.startsWith("/student/flashcards"),
  },
  {
    label: "Quizzes",
    href: "/student/library?tab=quizzes",
    icon: <QuizIcon />,
    match: (p) => p.startsWith("/student/quizzes"),
  },
  {
    label: "Library",
    href: "/student/library",
    icon: <LibraryIcon />,
    match: (p) => p.startsWith("/student/library"),
  },
  {
    label: "AI Helper",
    href: "/student/ai-helper",
    icon: <AiHelperIcon />,
    match: (p) => p.startsWith("/student/ai-helper"),
  },
  {
    label: "Subscription",
    href: "/student/subscription",
    icon: <SubscriptionIcon />,
    match: (p) => p.startsWith("/student/subscription"),
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function StudentSidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function load() {
      getUnreadSummary()
        .then((s) => setUnreadCount(s.totalUnread))
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col justify-between overflow-y-auto border-r border-ink-700/10 bg-white px-5 py-7 transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-7 pl-2.5">
          <Link href="/student" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900">Lumen</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-700/5 lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                  active
                    ? "bg-sky-100 font-semibold text-sky-700"
                    : "font-medium text-ink-500 hover:bg-ink-700/5 hover:text-ink-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          <div className="my-2.5 h-px bg-ink-700/8" />

          <Link
            href="/student/tutors"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
              pathname.startsWith("/student/tutors")
                ? "bg-sky-100 font-semibold text-sky-700"
                : "font-medium text-ink-500 hover:bg-ink-700/5 hover:text-ink-900"
            }`}
          >
            <BookTutorIcon />
            Book a tutor
          </Link>
          <Link
            href="/student#my-bookings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-700/5 hover:text-ink-900"
          >
            <MyBookingsIcon />
            My bookings
            {unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/student/report-issue"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
              pathname.startsWith("/student/report-issue")
                ? "bg-sky-100 font-semibold text-sky-700"
                : "font-medium text-ink-500 hover:bg-ink-700/5 hover:text-ink-900"
            }`}
          >
            <ReportIcon />
            Report an issue
          </Link>
          <Link
            href="/student/settings"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
              pathname.startsWith("/student/settings")
                ? "bg-sky-100 font-semibold text-sky-700"
                : "font-medium text-ink-500 hover:bg-ink-700/5 hover:text-ink-900"
            }`}
          >
            <SettingsIcon />
            Settings
          </Link>
        </nav>
      </div>

      {user && (
        <div className="flex items-center gap-2.5 border-t border-ink-700/8 pt-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
              <span className="font-display text-sm font-semibold text-sky-700">{initials(user.name)}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900">{user.name}</p>
            <span className="mt-0.5 inline-block rounded-full bg-sky-100 px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              {user.role.toLowerCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Log out"
            className="shrink-0 text-ink-300 transition hover:text-ink-700"
          >
            <LogOutIcon />
          </button>
        </div>
      )}
    </div>
  );
}
