import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, PaymentStatus, PayoutStatus } from '../prisma/prisma-enums';
import { MarkPayoutPaidDto } from './dto/mark-payout-paid.dto';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async mySummary(tutorId: string) {
    const [pendingPayments, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          payoutId: null,
          booking: { tutorId, status: BookingStatus.COMPLETED },
        },
        select: { tutorPayoutAmount: true },
      }),
      this.prisma.payout.findMany({ where: { tutorId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.tutorPayoutAmount), 0);
    const lifetimePaid = payouts
      .filter((p) => p.status === PayoutStatus.PAID)
      .reduce((sum, p) => sum + Number(p.totalAmount), 0);

    return { pendingAmount, lifetimePaid, payouts };
  }

  listAll() {
    return this.prisma.payout.findMany({
      include: { tutor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Batches every eligible payment (paid, not yet in a payout, for a completed
  // booking) into one new Payout per tutor. Mirrors the "scheduled payout job"
  // this platform's bookings service always assumed would exist eventually —
  // run manually by an admin rather than on a cron, matching the architecture
  // doc's manual/batched EFT payout design.
  async run() {
    const eligiblePayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        payoutId: null,
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
        const totalAmount = payments.reduce((sum, p) => sum + Number(p.tutorPayoutAmount), 0);
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
            payments: { connect: payments.map((p) => ({ id: p.id })) },
          },
          include: { tutor: { select: { id: true, name: true, email: true } } },
        });
      }),
    );

    return { created };
  }

  async markPaid(id: string, dto: MarkPayoutPaidDto) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    if (payout.status === PayoutStatus.PAID) {
      throw new ConflictException('Payout is already marked as paid');
    }

    return this.prisma.payout.update({
      where: { id },
      data: { status: PayoutStatus.PAID, paidAt: new Date(), reference: dto.reference },
      include: { tutor: { select: { id: true, name: true, email: true } } },
    });
  }
}
