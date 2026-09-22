import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="animate-drift absolute -left-32 top-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-drift-slow absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-gold-300/30 blur-3xl"
      />

      <div className={`relative w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-semibold text-ink-900"
        >
          <BrandMark />
          Lumen
        </Link>

        <div className="rounded-2xl border border-ink-700/10 bg-white/90 p-8 shadow-xl shadow-ink-900/5 backdrop-blur-sm">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
