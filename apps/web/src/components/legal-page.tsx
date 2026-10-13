import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl font-semibold text-ink-900">{children}</h2>;
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-cream">
      <header className="border-b border-ink-700/5 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink-900">
            <BrandMark />
            Lumen
          </Link>
          <Link href="/" className="text-sm text-sky-700 hover:text-sky-800">
            &larr; Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-300">Last updated: {lastUpdated}</p>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-ink-700">{children}</div>
      </main>

      <footer className="border-t border-ink-700/10 bg-cream-soft">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-ink-300">
          <Link href="/privacy" className="hover:text-ink-500">
            Privacy Policy
          </Link>
          <span className="mx-2">&middot;</span>
          <Link href="/terms" className="hover:text-ink-500">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
