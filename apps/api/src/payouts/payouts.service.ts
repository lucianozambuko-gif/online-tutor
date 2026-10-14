import { randomBytes } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingStatus,
  PaymentStatus,
  PayoutStatus,
} from '../prisma/prisma-enums';
import { MarkPayoutPaidDto } from './dto/mark-payout-paid.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TEST_PAYMENT_REF } from '../payments/payments.service';

// Generated at payout-creation time (not when marked paid) so an admin has
// something to actually use as the reference on the real-world EFT, rather
// than typing one in after the fact once the transfer's already been made.
function generatePayoutReference(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `LMN-${stamp}-${suffix}`;
}

const TUTOR_SELECT = {
  id: true,
  name: true,
  email: true,
  tutorProfile: {
    select: {
      bankName: true,
      accountHolder: true,
      accountNumber: true,
      branchCode: true,
      accountType: true,
    },
  },
} as const;

function withTotalMinutes<
  T extends { payments: { booking: { durationMinutes: number } }[] },
>(payout: T) {
  const totalMinutes = payout.payments.reduce(
    (sum, p) => sum + p.booking.durationMinutes,
    0,
  );
  return { ...payout, totalMinutes };
}

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async mySummary(tutorId: string) {
    const [pendingPayments, payoutRows] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          payoutId: null,
          payfastRef: { not: TEST_PAYMENT_REF },
          booking: { tutorId, status: BookingStatus.COMPLETED },
        },
        select: {
          tutorPayoutAmount: true,
          booking: { select: { durationMinutes: true } },
        },
      }),
      this.prisma.payout.findMany({
        where: { tutorId },
        orderBy: { createdAt: 'desc' },
        include: {
          payments: {
            select: { booking: { select: { durationMinutes: true } } },
          },
        },
      }),
    ]);

    const pendingAmount = pendingPayments.reduce(
      (sum, p) => sum + Number(p.tutorPayoutAmount),
      0,
    );
    const pendingMinutes = pendingPayments.reduce(
      (sum, p) => sum + p.booking.durationMinutes,
      0,
    );
    const payouts = payoutRows.map(withTotalMinutes);
    const lifetimePaid = payouts
      .filter((p) => p.status === PayoutStatus.PAID)
      .reduce((sum, p) => sum + Number(p.totalAmount), 0);

    return { pendingAmount, pendingMinutes, lifetimePaid, payouts };
  }

  async listAll() {
    const payouts = await this.prisma.payout.findMany({
      include: {
        tutor: { select: TUTOR_SELECT },
        payments: {
          select: { booking: { select: { durationMinutes: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return payouts.map(withTotalMinutes);
  }

  // Batches every eligible payment (paid, not yet in a payout, for a completed
  // booking) into one new Payout per tutor. Mirrors the "scheduled payout job"
  // this platform's bookings service always assumed would exist eventually —
  // run manually by an admin rather than on a cron, matching the architecture
  // doc's manual/batched EFT payout design.
  async run(adminId: string) {
    const eligiblePayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        payoutId: null,
        payfastRef: { not: TEST_PAYMENT_REF },
        booking: { status: BookingStatus.COMPLETED },
      },
      include: { booking: { select: { tutorId: true } } },
    });

    if (eligiblePayments.length === 0) {
      return { created: [] };
    }

    const byTutor = new Map<string, typeof eligiblePayments>();
    for (const payment of eligiblePayments) {
      const tutorId = payment.booking.tutorId;
      const group = byTutor.get(tutorId) ?? [];
      group.push(payment);
      byTutor.set(tutorId, group);
    }

    const now = new Date();
    const created = await this.prisma.$transaction(
      Array.from(byTutor.entries()).map(([tutorId, payments]) => {
        const totalAmount = payments.reduce(
          (sum, p) => sum + Number(p.tutorPayoutAmount),
          0,
        );
        const periodStart = payments.reduce(
          (min, p) => (p.createdAt < min ? p.createdAt : min),
          payments[0].createdAt,
        );

        return this.prisma.payout.create({
          data: {
            tutorId,
            periodStart,
            periodEnd: now,
            totalAmount,
            status: PayoutStatus.PENDING,
            reference: generatePayoutReference(),
            payments: { connect: payments.map((p) => ({ id: p.id })) },
          },
          include: {
            tutor: { select: TUTOR_SELECT },
            payments: {
              select: { booking: { select: { durationMinutes: true } } },
            },
          },
        });
      }),
    );

    await Promise.all(
      created.map((payout) =>
        this.auditLog.record(
          adminId,
          'PAYOUT_BATCH_CREATED',
          'Payout',
          payout.id,
        ),
      ),
    );

    return { created: created.map(withTotalMinutes) };
  }

  // dto.reference is an optional override — every payout already got an
  // auto-generated reference when it was created, so leaving it out here
  // (Prisma skips undefined fields on update) just keeps that one.
  async markPaid(adminId: string, id: string, dto: MarkPayoutPaidDto) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    if (payout.status === PayoutStatus.PAID) {
      throw new ConflictException('Payout is already marked as paid');
    }

    const result = await this.prisma.payout.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
        reference: dto.reference,
      },
      include: { tutor: { select: TUTOR_SELECT } },
    });
    await this.auditLog.record(adminId, 'PAYOUT_MARKED_PAID', 'Payout', id);
    return result;
  }
}
