"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getQuiz, submitQuiz, ApiError, type Quiz } from "@/lib/api";
import { Card, buttonClass, ErrorText } from "@/components/ui";
import { MarkdownContent } from "@/components/markdown-content";

export default function QuizPage({ params }: PageProps<"/student/quizzes/[id]">) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Set only right after a successful submit — the quiz's own record doesn't
  // persist which option the student picked per question, only the score, so
  // this per-question right/wrong view is only available for this one session.
  const [justSubmittedAnswers, setJustSubmittedAnswers] = useState<number[] | null>(null);

  useEffect(() => {
    getQuiz(id)
      .then((q) => {
        setQuiz(q);
        setAnswers(new Array(q.questions.length).fill(null));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this quiz."));
  }, [id]);

  async function handleSubmit() {
    if (!quiz || answers.some((a) => a === null)) return;
    setSubmitting(true);
    setError(null);
    try {
      const finalAnswers = answers as number[];
      const updated = await submitQuiz(quiz.id, finalAnswers);
      setQuiz(updated);
      setJustSubmittedAnswers(finalAnswers);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong submitting your quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !quiz) {
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

  if (!quiz) {
    return <p className="text-sm text-ink-500">Loading quiz...</p>;
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/student/library?tab=quizzes" className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to quizzes
        </Link>
        <div className="mt-4">
          <ErrorText>This quiz has no questions — it looks like generation failed partway. Try generating it again.</ErrorText>
        </div>
      </div>
    );
  }

  const showResults = quiz.attempted;
  const canSubmit = !submitting && answers.every((a) => a !== null);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/student/library?tab=quizzes" className="text-sm text-sky-700 hover:text-sky-800">
        &larr; Back to quizzes
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-ink-900">{quiz.topic}</h1>
        {showResults && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
            Score: {quiz.score}/{quiz.totalQuestions}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {quiz.difficulty ?? "medium"} difficulty &middot; {quiz.questions.length} questions
      </p>

      <div className="mt-6 space-y-5">
        {quiz.questions.map((q, qi) => {
          const pickedIndex = justSubmittedAnswers ? justSubmittedAnswers[qi] : null;
          const revealAnswer = showResults;

          return (
            <Card key={q.id}>
              <div className="flex gap-1.5 font-medium text-ink-900">
                <span>{qi + 1}.</span>
                <MarkdownContent content={q.question} />
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((option, oi) => {
                  const isCorrect = oi === q.answerIndex;
                  const isPicked = pickedIndex === oi;
                  let optionClass = "border-ink-700/15 hover:border-sky-400/50";
                  if (revealAnswer) {
                    if (isCorrect) optionClass = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40";
                    else if (isPicked) optionClass = "border-red-300 bg-red-50 dark:bg-red-950/40";
                  } else if (answers[qi] === oi) {
                    optionClass = "border-sky-400 bg-sky-50";
                  }

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={showResults}
                      onClick={() => {
                        setAnswers((prev) => {
                          const next = [...prev];
                          next[qi] = oi;
                          return next;
                        });
                      }}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${optionClass}`}
                    >
                      <MarkdownContent content={option} />
                    </button>
                  );
                })}
              </div>
              {revealAnswer && (
                <div className="mt-3 text-sm text-ink-500">
                  <MarkdownContent content={q.explanation} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {!showResults && (
        <button type="button" onClick={handleSubmit} disabled={!canSubmit} className={buttonClass("primary", "mt-6 w-full")}>
          {submitting ? "Submitting..." : "Submit quiz"}
        </button>
      )}
    </div>
  );
}
