"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  ApiError,
  type SubscriptionSummary,
  type SubscriptionPlan,
} from "@/lib/api";
import { redirectToPayfast } from "@/lib/payfast";
import { formatResetIn } from "@/lib/format";
import { Card, buttonClass, ErrorText } from "@/components/ui";

interface PlanCard {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
}

const PLAN_CARDS: PlanCard[] = [
  {
    plan: "FREE",
    name: "Free",
    price: "R0",
    tagline: "Try Lumen AI out",
    features: [
      "20 AI Helper messages every 5 hours",
      "10 notes/flashcards/quizzes / month",
      "Attach 1 PDF/Word document per message",
      "Text questions only, no photos",
      "Remembers your last 14 messages",
    ],
  },
  {
    plan: "PLUS",
    name: "Plus",
    price: "R49",
    tagline: "For regular studying",
    features: [
      "150 AI Helper messages / month",
      "60 notes/flashcards/quizzes / month",
      "Attach up to 3 photos or documents per message",
      "Remembers your last 20 messages",
    ],
  },
  {
    plan: "PRO",
    name: "Pro",
    price: "R89",
    tagline: "For exam crunch time",
    features: [
      "Unlimited AI Helper messages",
      "Unlimited notes/flashcards/quizzes",
      "Attach up to 5 photos or documents per message",
      "Remembers your last 40 messages",
      "Priority on reported issues",
    ],
  },
];

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return <p className="text-xs text-ink-500">{used} used · unlimited</p>;
  }
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div>
      <p className="text-xs text-ink-500">
        {used} / {limit} used
      </p>
      <div className="mt-1 h-1.5 w-full rounded-full bg-ink-700/8">
        <div
          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-400" : "bg-sky-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionPageContent() {
  const searchParams = useSearchParams();
  const upgradeResult = searchParams.get("upgrade");

  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    getMySubscription()
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your subscription."));
  }

  useEffect(load, []);

  async function handleUpgrade(plan: "PLUS" | "PRO") {
    setBusyPlan(plan);
    setError(null);
    try {
      const { actionUrl, fields } = await upgradeSubscription(plan);
      redirectToPayfast(actionUrl, fields);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong starting checkout.");
      setBusyPlan(null);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel your subscription? You'll keep your plan until the end of the current period, then move to Free.")) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelSubscription();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong cancelling.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Subscription</h1>
        <p className="mt-1 text-sm text-ink-500">Upgrade for more AI Helper messages, photo help, and more generations.</p>
      </div>

      {upgradeResult === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          Thanks! Your plan will update as soon as PayFast confirms the payment — refresh in a moment if it hasn&apos;t yet.
        </div>
      )}
      {upgradeResult === "cancelled" && (
        <div className="rounded-2xl border border-ink-700/10 bg-white p-4 text-sm text-ink-500">Checkout was cancelled.</div>
      )}
      {error && <ErrorText>{error}</ErrorText>}

      {summary && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-500">Current plan</p>
              <p className="font-display text-xl font-semibold text-ink-900">{summary.plan}</p>
            </div>
            {summary.plan !== "FREE" && summary.status === "ACTIVE" && (
              <button type="button" onClick={handleCancel} disabled={cancelling} className={buttonClass("outline")}>
                {cancelling ? "Cancelling..." : "Cancel subscription"}
              </button>
            )}
            {summary.status === "CANCELLED" && (
              <span className="text-sm text-ink-500">
                Cancelled — active until {summary.periodEnd ? new Date(summary.periodEnd).toLocaleDateString() : "period end"}
              </span>
            )}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">AI Helper messages</p>
              <div className="mt-1.5">
                <UsageBar used={summary.aiMessagesUsed} limit={summary.aiMessagesLimit} />
              </div>
              {summary.plan === "FREE" && summary.aiMessagesResetAt && (
                <p className="mt-1 text-xs text-ink-300">Resets in {formatResetIn(summary.aiMessagesResetAt)}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Notes/flashcards/quizzes</p>
              <div className="mt-1.5">
                <UsageBar used={summary.generationsUsed} limit={summary.generationsLimit} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {PLAN_CARDS.map((card) => {
          const isCurrent = summary?.plan === card.plan;
          return (
            <Card key={card.plan} className={isCurrent ? "border-sky-400/60 ring-2 ring-sky-400/30" : ""}>
              <p className="font-display text-lg font-semibold text-ink-900">{card.name}</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink-900">
                {card.price}
                <span className="text-sm font-normal text-ink-300">{card.plan === "FREE" ? "" : "/mo"}</span>
              </p>
              <p className="mt-1 text-sm text-ink-500">{card.tagline}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {card.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-sky-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {card.plan === "FREE" ? (
                <div className="mt-5 h-[42px]" />
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || busyPlan !== null}
                  onClick={() => handleUpgrade(card.plan as "PLUS" | "PRO")}
                  className={buttonClass(isCurrent ? "outline" : "primary", "mt-5 w-full")}
                >
                  {isCurrent ? "Current plan" : busyPlan === card.plan ? "Redirecting..." : `Upgrade to ${card.name}`}
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading...</p>}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
