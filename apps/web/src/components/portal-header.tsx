"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { buttonClass } from "@/components/ui";

export function PortalHeader({ portalRoot }: { portalRoot: string }) {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href={portalRoot}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink-900"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600" />
          Lumen
        </Link>
        {!loading && user && (
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-white px-3.5 py-1.5 text-sm text-ink-700 shadow-sm sm:inline-flex sm:items-center sm:gap-2">
              {user.name}
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {user.role.toLowerCase()}
              </span>
            </span>
            <button type="button" onClick={() => logout()} className={buttonClass("outline")}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
