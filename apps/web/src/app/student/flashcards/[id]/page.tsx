"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getFlashcardSet, ApiError, type FlashcardSet } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";

export default function FlashcardSetPage({ params }: PageProps<"/student/flashcards/[id]">) {
  const { id } = use(params);
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    getFlashcardSet(id)
      .then(setSet)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this flashcard set."));
  }, [id]);

  function goTo(next: number) {
    if (!set) return;
    setFlipped(false);
    setIndex(Math.max(0, Math.min(set.cards.length - 1, next)));
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/student" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to dashboard
        </Link>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  if (!set) {
    return <p className="text-sm text-ink-500">Loading flashcards...</p>;
  }

  if (set.cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/student/library?tab=flashcards" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to flashcards
        </Link>
        <div className="mt-4">
          <ErrorText>This set has no cards — it looks like generation failed partway. Try generating it again.</ErrorText>
        </div>
      </div>
    );
  }

  const card = set.cards[index];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/student/library?tab=flashcards" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to flashcards
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">{set.topic}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Card {index + 1} of {set.cards.length}
      </p>

      <button type="button" onClick={() => setFlipped((f) => !f)} className="mt-6 w-full text-left" aria-label="Flip card">
        <Card className="flex min-h-[220px] items-center justify-center p-8 text-center transition hover:border-sky-400/50">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-300">
              {flipped ? "Answer" : "Question"}
            </p>
            <div className="mt-3 text-lg text-ink-900">
              <MarkdownContent content={flipped ? card.back : card.front} />
            </div>
          </div>
        </Card>
      </button>
      <p className="mt-2 text-center text-xs text-ink-300">Click the card to flip it</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} className={buttonClass("outline")}>
          Previous
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === set.cards.length - 1}
          className={buttonClass("primary")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
