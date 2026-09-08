import { SubscriptionPlan } from '../prisma/prisma-enums';

export interface PlanLimits {
  // PLUS/PRO: messages allowed per 30-day period. FREE: messages allowed per
  // FREE_AI_MESSAGE_WINDOW_HOURS-hour rolling window instead (see below) —
  // the number here is that window's cap, not a monthly one.
  aiMessages: number | null;
  generations: number | null;
  vision: boolean;
  historyMessages: number;
  maxFilesPerMessage: number;
}

// null = unlimited. "generations" covers notes + flashcard sets + quizzes
// combined, one increment per generate call regardless of card/question count.
// historyMessages must be generous enough that a student can actually finish
// a multi-turn task (e.g. working through an essay outline section by
// section) before earlier turns roll out of the model's context — 6 was only
// ~3 exchanges, easy to blow through in one real session.
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    aiMessages: 5,
    generations: 10,
    vision: false,
    historyMessages: 14,
    maxFilesPerMessage: 1,
  },
  PLUS: {
    aiMessages: 150,
    generations: 60,
    vision: true,
    historyMessages: 20,
    maxFilesPerMessage: 3,
  },
  PRO: {
    aiMessages: null,
    generations: null,
    vision: true,
    historyMessages: 40,
    maxFilesPerMessage: 5,
  },
};

// The highest per-message file cap across all plans — used to size the
// upload interceptor itself, which can't vary by the requester's plan.
// Per-plan enforcement happens in SubscriptionsService.
export const MAX_FILES_PER_MESSAGE_CAP = PLAN_LIMITS.PRO.maxFilesPerMessage;

export const PLAN_PRICE_ZAR: Record<'PLUS' | 'PRO', number> = {
  PLUS: 49,
  PRO: 89,
};

export const SUBSCRIPTION_PERIOD_DAYS = 30;

// Free plan's AI Helper access resets on a short rolling window instead of
// the monthly period, so a student always has some access again a few hours
// later rather than waiting for the billing period to roll over.
export const FREE_AI_MESSAGE_WINDOW_HOURS = 5;
export const FREE_AI_MESSAGE_WINDOW_MS =
  FREE_AI_MESSAGE_WINDOW_HOURS * 60 * 60 * 1000;
