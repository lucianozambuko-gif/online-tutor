import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '../prisma/prisma-enums';
import {
  generatePayfastSignature,
  getPayfastBaseUrl,
} from '../payments/payfast.util';
import { callSubscriptionApi } from '../payments/payfast-subscription.util';
import {
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

  // upsert (not findUnique-then-create) so two concurrent first-touch
  // requests for the same student — e.g. two components both loading the
  // summary on mount — can't race to insert the row and hit the unique
  // constraint on studentId.
  async getOrCreate(studentId: string) {
    return this.prisma.subscription.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        periodStart: new Date(),
        periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
      },
    });
  }

  // Lazily rolls the usage window forward — called before every read/check so
  // a missed renewal webhook or a free student's monthly reset both "just
  // happen" the next time they touch the app, no cron job required.
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
          aiMessagesUsed: 0,
          generationsUsed: 0,
        },
      });
    }

    // A paid plan's period elapsed with no renewal (cancelled, or a missed
    // ITN) — fall back to Free rather than let paid perks run on trust.
    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        periodStart: new Date(),
        periodEnd: addDays(new Date(), SUBSCRIPTION_PERIOD_DAYS),
        aiMessagesUsed: 0,
        generationsUsed: 0,
      },
    });
  }

  async getSummary(studentId: string) {
    const sub = await this.resetIfNeeded(await this.getOrCreate(studentId));
    const limits = PLAN_LIMITS[sub.plan];

    return {
      plan: sub.plan,
      status: sub.status,
      periodEnd: sub.periodEnd,
      aiMessagesUsed: sub.aiMessagesUsed,
      aiMessagesLimit: limits.aiMessages,
      generationsUsed: sub.generationsUsed,
      generationsLimit: limits.generations,
      canUseVision: limits.vision,
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
