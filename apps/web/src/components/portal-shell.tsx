"use client";

import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function PortalShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const sidebarWithState = isValidElement(sidebar)
    ? cloneElement(sidebar as ReactElement<SidebarProps>, { open, onClose: () => setOpen(false) })
    : sidebar;

  return (
    <div className="flex min-h-screen">
      {sidebarWithState}

      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-700/10 bg-white px-5 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 transition hover:bg-ink-700/5"
          >
            <MenuIcon />
          </button>
          <span className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-ink-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600" />
            Lumen
          </span>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">{children}</div>
      </div>
    </div>
  );
}
