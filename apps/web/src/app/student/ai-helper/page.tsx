"use client";

import Link from "next/link";
import { AiHelperChat } from "@/components/ai-helper-chat";

export default function AiHelperPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to dashboard
      </Link>
      <div className="mt-4">
        <h1 className="font-display text-2xl font-semibold text-ink-900">AI Helper</h1>
        <p className="mt-1 text-sm text-ink-500">
          Ask about anything you&apos;re studying, attach a photo of a problem or a PDF/Word document, or ask it
          to format your references or review your own writing — it&apos;ll help you work through things, not
          just hand you the answer.
        </p>
      </div>

      <div className="mt-6">
        <AiHelperChat />
      </div>
    </div>
  );
}
