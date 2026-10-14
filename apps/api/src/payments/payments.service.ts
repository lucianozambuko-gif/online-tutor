import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '../prisma/prisma-enums';
import { generatePayfastSignature, getPayfastBaseUrl } from './payfast.util';
import { callRefundApi } from './payfast-management-api.util';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

// Sentinel payfastRef for payments an admin force-marked paid for testing
// (e.g. exercising a real tutor's booking flow without real money moving).
// Payouts excludes anything tagged with this so a test payment can never
// turn into a real EFT obligation to the tutor.
export const TEST_PAYMENT_REF = 'ADMIN_TEST_PAYMENT';

const ADMIN_PAYMENT_INCLUDE = {
  booking: {
    select: {
      id: true,
      subject: true,
      scheduledAt: true,
      student: { select: { id: true, name: true, email: true } },
      tutor: { select: { id: true, name: true, email: true } },
    },
  },
} as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Admin-only: every payment on the platform, newest first — the only place
  // an admin can see money coming IN (Payouts only cover money going out).
  adminList() {
    return this.prisma.payment.findMany({
      include: ADMIN_PAYMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async initiate(bookingId: string, studentId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, student: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.studentId !== studentId) {
      throw new ForbiddenException(
        'Only the student who booked this session can pay for it',
      );
    }
    if (!booking.payment) {
      throw new NotFoundException('No payment record for this booking');
    }
    if (booking.payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment is already ${booking.payment.status.toLowerCase()}`,
      );
    }

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const apiPublicUrl =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.PORT ?? 3001}`;
    const [firstName, ...rest] = booking.student.name.split(' ');

    const fields: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID ?? '',
      merchant_key: process.env.PAYFAST_MERCHANT_KEY ?? '',
      return_url: `${webOrigin}/student/bookings/${booking.id}?payment=success`,
      cancel_url: `${webOrigin}/student/bookings/${booking.id}?payment=cancelled`,
      notify_url: `${apiPublicUrl}/payments/payfast/notify`,
      name_first: firstName,
      name_last: rest.join(' ') || firstName,
      email_address: booking.student.email,
      m_payment_id: booking.payment.id,
      amount: Number(booking.payment.amount).toFixed(2),
      item_name: `Tutoring session: ${booking.subject}`,
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
        `PayFast ITN signature mismatch for m_payment_id=${body.m_payment_id}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: body.m_payment_id },
    });
    if (!payment) {
      this.logger.warn(
        `PayFast ITN for unknown payment id=${body.m_payment_id}`,
      );
      return { received: true };
    }

    if (body.payment_status === 'COMPLETE') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, payfastRef: body.pf_payment_id },
      });
    } else if (body.payment_status === 'FAILED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    } else {
      this.logger.warn(
        `Unhandled PayFast ITN payment_status="${body.payment_status}" for payment=${payment.id}`,
      );
    }

    return { received: true };
  }

  // Admin-only. Calls PayFast's real refund API against the transaction's
  // pf_payment_id (captured from the ITN above) — NOTE this cannot be tested
  // in PayFast's sandbox, which rejects refund calls outright; it needs to be
  // exercised against live credentials before being trusted in production.
  async refund(adminId: string, paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (
      payment.status !== PaymentStatus.PAID &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException(
        `Payment is ${payment.status.toLowerCase()}, not paid — nothing to refund`,
      );
    }
    if (!payment.payfastRef) {
      throw new BadRequestException(
        'This payment has no PayFast reference to refund against',
      );
    }

    const alreadyRefunded = Number(payment.refundedAmount ?? 0);
    const totalAmount = Number(payment.amount);
    const remaining = Math.round((totalAmount - alreadyRefunded) * 100) / 100;

    if (remaining <= 0) {
      throw new BadRequestException(
        'This payment has already been fully refunded',
      );
    }

    const refundAmountRand = dto.amount ?? remaining;
    if (refundAmountRand > remaining) {
      throw new BadRequestException(
        `You can refund at most R${remaining.toFixed(2)} more on this payment`,
      );
    }

    const { status, data } = await callRefundApi(
      payment.payfastRef,
      {
        merchantId: process.env.PAYFAST_MERCHANT_ID ?? '',
        passphrase: process.env.PAYFAST_PASSPHRASE,
        sandbox: process.env.PAYFAST_SANDBOX !== 'false',
      },
      {
        amount: Math.round(refundAmountRand * 100),
        reason: dto.reason,
      },
    );

    if (status >= 400) {
      this.logger.error(
        `PayFast refund failed for payment=${paymentId}, status=${status}, response=${JSON.stringify(data)}`,
      );
      throw new BadGatewayException(
        "PayFast rejected the refund — check the server logs for details, or refund it directly from PayFast's merchant dashboard.",
      );
    }

    const newRefundedAmount =
      Math.round((alreadyRefunded + refundAmountRand) * 100) / 100;
    const isFullyRefunded = newRefundedAmount >= totalAmount;

    const result = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: isFullyRefunded
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: newRefundedAmount,
        refundReason: dto.reason,
        refundedAt: new Date(),
      },
    });
    await this.auditLog.record(
      adminId,
      isFullyRefunded ? 'PAYMENT_REFUNDED' : 'PAYMENT_PARTIALLY_REFUNDED',
      'Payment',
      paymentId,
    );
    return result;
  }

  // Admin-only: forces a pending payment straight to PAID without going
  // through PayFast at all, so a real booking (with a real tutor) can be
  // pushed through to a video session for testing. Tagged with
  // TEST_PAYMENT_REF so PayoutsService never batches it into a real EFT —
  // this must never create an actual payout obligation to the tutor.
  async markTestPaid(adminId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment is already ${payment.status.toLowerCase()}`,
      );
    }

    const result = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        method: PaymentMethod.EFT,
        payfastRef: TEST_PAYMENT_REF,
      },
    });
    await this.auditLog.record(
      adminId,
      'PAYMENT_MARKED_TEST_PAID',
      'Payment',
      paymentId,
    );
    return result;
  }
}
