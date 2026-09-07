import { SubscriptionPlan } from '../prisma/prisma-enums';

export interface PlanLimits {
  aiMessages: number | null;
  generations: number | null;
  vision: boolean;
  historyMessages: number;
}

// null = unlimited. "generations" covers notes + flashcard sets + quizzes
// combined, one increment per generate call regardless of card/question count.
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: { aiMessages: 15, generations: 10, vision: false, historyMessages: 6 },
  PLUS: { aiMessages: 150, generations: 60, vision: true, historyMessages: 20 },
  PRO: {
    aiMessages: null,
    generations: null,
    vision: true,
    historyMessages: 40,
  },
};

export const PLAN_PRICE_ZAR: Record<'PLUS' | 'PRO', number> = {
  PLUS: 49,
  PRO: 89,
};

export const SUBSCRIPTION_PERIOD_DAYS = 30;
