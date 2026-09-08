import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { SubscriptionPlan, SubscriptionStatus } from '../prisma/prisma-enums';
import {
  generatePayfastSignature,
  getPayfastBaseUrl,
} from '../payments/payfast.util';
import { callSubscriptionApi } from '../payments/payfast-subscription.util';
import {
  FREE_AI_MESSAGE_WINDOW_MS,
  PLAN_LIMITS,
  PLAN_PRICE_ZAR,
  SUBSCRIPTION_PERIOD_DAYS,
} from './plan-limits';

export type UsageKind = 'AI_MESSAGE' | 'GENERATION';

type SubscriptionRow = Awaited<ReturnType<SubscriptionsService['getOrCreate']>>;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // upsert so two concurrent first-touch requests for the same student can't
  // both pass a findUnique-then-create check and race to insert. That alone
  // still isn't fully race-proof here — Prisma's upsert isn't always a
  // single atomic statement, so two upserts landing at the DB at nearly the
  // same moment can still both attempt the insert. When that happens the
  // loser's insert fails on the unique constraint (P2002) rather than the
  // update path, since its own upsert already decided to insert before
  // seeing the winner's row — at that point the row definitely exists, so
  // just re-read it instead of surfacing a 500.
  async getOrCreate(studentId: string) {
    try {
      return await this.prisma.subscription.upsert({
        where: { studentId },
        update: {},
        create: {
          studentId,
          periodStart: new Date(),
          periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.subscription.findUnique({
          where: { studentId },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  // Lazily rolls the monthly usage window forward — called before every
  // read/check so a missed renewal webhook or a free student's monthly reset
  // both "just happen" the next time they touch the app, no cron job
  // required. Only covers generationsUsed for FREE now — aiMessagesUsed on
  // FREE is governed by the separate short rolling window below instead.
  private async resetIfNeeded(sub: SubscriptionRow) {
    if (!sub.periodEnd || sub.periodEnd.getTime() > Date.now()) {
      return sub;
    }

    if (sub.plan === SubscriptionPlan.FREE) {
      return this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          periodStart: new Date(),
          periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
          generationsUsed: 0,
        },
      });
    }

    // A paid plan's period elapsed with no renewal (cancelled, or a missed
    // ITN) — fall back to Free rather than let paid perks run on trust. The
    // student's next AI message will start their own fresh 5-hour window.
    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        periodStart: new Date(),
        periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
        aiMessagesUsed: 0,
        aiMessageWindowStart: null,
        generationsUsed: 0,
      },
    });
  }

  // Free plan's AI Helper limit is a short rolling window rather than a
  // monthly count: once the window has elapsed the slate wipes clean, so a
  // student is never stuck waiting for a billing period to roll over — just
  // a few hours. Returns null while still within an active, unexpired window
  // (i.e. no reset due), or the window's start time if one should begin/has
  // begun aging.
  private freeAiWindowElapsed(sub: SubscriptionRow): boolean {
    if (!sub.aiMessageWindowStart) return true;
    return (
      Date.now() - sub.aiMessageWindowStart.getTime() >=
      FREE_AI_MESSAGE_WINDOW_MS
    );
  }

  async getSummary(studentId: string) {
    const sub = await this.resetIfNeeded(await this.getOrCreate(studentId));
    const limits = PLAN_LIMITS[sub.plan];
    const isFree = sub.plan === SubscriptionPlan.FREE;

    const freeWindowElapsed = isFree && this.freeAiWindowElapsed(sub);
    const aiMessagesUsed = isFree
      ? freeWindowElapsed
        ? 0
        : sub.aiMessagesUsed
      : sub.aiMessagesUsed;
    const aiMessagesResetAt = isFree
      ? sub.aiMessageWindowStart && !freeWindowElapsed
        ? new Date(
            sub.aiMessageWindowStart.getTime() + FREE_AI_MESSAGE_WINDOW_MS,
          )
        : null
      : sub.periodEnd;

    return {
      plan: sub.plan,
      status: sub.status,
      periodEnd: sub.periodEnd,
      aiMessagesUsed,
      aiMessagesLimit: limits.aiMessages,
      aiMessagesResetAt,
      generationsUsed: sub.generationsUsed,
      generationsLimit: limits.generations,
      canUseVision: limits.vision,
      maxFilesPerMessage: limits.maxFilesPerMessage,
    };
  }

  // Admin overview — only students who've actually touched a Subscription row
  // (i.e. used an AI feature at least once) show up here; a student who's
  // never generated anything has no row yet, which is fine, they're Free.
  adminList() {
    return this.prisma.subscription.findMany({
      where: { plan: { not: SubscriptionPlan.FREE } },
      orderBy: { updatedAt: 'desc' },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }

  historyMessageLimit(plan: SubscriptionPlan): number {
    return PLAN_LIMITS[plan].historyMessages;
  }

  maxFilesPerMessage(plan: SubscriptionPlan): number {
    return PLAN_LIMITS[plan].maxFilesPerMessage;
  }

  // Called before an AI helper reply or a note/flashcard/quiz generation.
  // Throws (no increment) if the plan's limit or vision permission is already
  // exhausted; otherwise increments the relevant counter and returns the
  // now-current plan, so callers can also gate feature access (e.g. vision).
  async checkAndIncrementUsage(
    studentId: string,
    kind: UsageKind,
    options: { requiresVision?: boolean } = {},
  ): Promise<SubscriptionPlan> {
    const sub = await this.resetIfNeeded(await this.getOrCreate(studentId));
    const limits = PLAN_LIMITS[sub.plan];

    if (options.requiresVision && !limits.vision) {
      throw new ForbiddenException(
        'Image help is available on the Plus and Pro plans — upgrade to unlock it, or ask without an image.',
      );
    }

    if (kind === 'AI_MESSAGE' && sub.plan === SubscriptionPlan.FREE) {
      await this.checkAndIncrementFreeAiMessage(sub);
      return sub.plan;
    }

    const limit =
      kind === 'AI_MESSAGE' ? limits.aiMessages : limits.generations;
    const used =
      kind === 'AI_MESSAGE' ? sub.aiMessagesUsed : sub.generationsUsed;

    if (limit !== null && used >= limit) {
      const label =
        kind === 'AI_MESSAGE'
          ? 'AI Helper messages'
          : 'note/flashcard/quiz generations';
      throw new ForbiddenException(
        `You've used all ${limit} ${label} included in your ${sub.plan} plan this month. Upgrade for more.`,
      );
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data:
        kind === 'AI_MESSAGE'
          ? { aiMessagesUsed: { increment: 1 } }
          : { generationsUsed: { increment: 1 } },
    });

    return sub.plan;
  }

  private async checkAndIncrementFreeAiMessage(sub: SubscriptionRow) {
    const limit = PLAN_LIMITS.FREE.aiMessages!;
    const windowElapsed = this.freeAiWindowElapsed(sub);
    const usedInWindow = windowElapsed ? 0 : sub.aiMessagesUsed;

    if (usedInWindow >= limit) {
      const resetAt =
        sub.aiMessageWindowStart!.getTime() + FREE_AI_MESSAGE_WINDOW_MS;
      const minutesLeft = Math.max(
        1,
        Math.ceil((resetAt - Date.now()) / 60000),
      );
      const hours = Math.floor(minutesLeft / 60);
      const minutes = minutesLeft % 60;
      const wait = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      throw new ForbiddenException(
        `You've used all ${limit} free AI Helper messages for now — try again in ${wait}, or upgrade for more.`,
      );
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: windowElapsed
        ? { aiMessagesUsed: 1, aiMessageWindowStart: new Date() }
        : { aiMessagesUsed: { increment: 1 } },
    });
  }

  async initiateUpgrade(studentId: string, plan: 'PLUS' | 'PRO') {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const apiPublicUrl =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.PORT ?? 3001}`;
    const [firstName, ...rest] = student.name.split(' ');
    const amount = PLAN_PRICE_ZAR[plan].toFixed(2);
    const today = new Date().toISOString().slice(0, 10);

    const fields: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID ?? '',
      merchant_key: process.env.PAYFAST_MERCHANT_KEY ?? '',
      return_url: `${webOrigin}/student/subscription?upgrade=success`,
      cancel_url: `${webOrigin}/student/subscription?upgrade=cancelled`,
      notify_url: `${apiPublicUrl}/subscriptions/notify`,
      name_first: firstName,
      name_last: rest.join(' ') || firstName,
      email_address: student.email,
      m_payment_id: `${studentId}-${plan}-${Date.now()}`,
      amount,
      item_name: `Lumen ${plan} subscription`,
      subscription_type: '1',
      billing_date: today,
      recurring_amount: amount,
      frequency: '3',
      cycles: '0',
      custom_str1: studentId,
      custom_str2: plan,
    };

    const signature = generatePayfastSignature(
      fields,
      process.env.PAYFAST_PASSPHRASE,
    );

    return {
      actionUrl: `${getPayfastBaseUrl()}/eng/process`,
      fields: { ...fields, signature },
    };
  }

  async handleNotify(body: Record<string, string>) {
    const { signature, ...rest } = body;
    const expectedSignature = generatePayfastSignature(
      rest,
      process.env.PAYFAST_PASSPHRASE,
    );

    if (signature !== expectedSignature) {
      this.logger.warn(
        `Subscription ITN signature mismatch for student=${body.custom_str1}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const studentId = body.custom_str1;
    const plan = body.custom_str2 as SubscriptionPlan;
    if (!studentId || !(plan === 'PLUS' || plan === 'PRO')) {
      this.logger.warn('Subscription ITN missing student/plan custom fields');
      return { received: true };
    }

    const sub = await this.getOrCreate(studentId);

    if (body.payment_status === 'COMPLETE') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          plan,
          status: SubscriptionStatus.ACTIVE,
          payfastToken: body.token || sub.payfastToken,
          periodStart: new Date(),
          periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
          aiMessagesUsed: 0,
          generationsUsed: 0,
        },
      });
    } else if (body.payment_status === 'FAILED') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    }

    return { received: true };
  }

  async cancel(studentId: string) {
    const sub = await this.getOrCreate(studentId);
    if (sub.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException("You're already on the Free plan");
    }

    if (sub.payfastToken) {
      const { status } = await callSubscriptionApi(
        sub.payfastToken,
        'PUT',
        'cancel',
        {
          merchantId: process.env.PAYFAST_MERCHANT_ID ?? '',
          passphrase: process.env.PAYFAST_PASSPHRASE,
          sandbox: process.env.PAYFAST_SANDBOX !== 'false',
        },
      );
      if (status >= 400) {
        this.logger.error(
          `PayFast subscription cancel failed for student=${studentId}, status=${status}`,
        );
      }
    }

    // Takes effect at period end — resetIfNeeded downgrades to Free once the
    // already-paid-for period actually runs out.
    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
