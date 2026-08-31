import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../prisma/prisma-enums';
import { generatePayfastSignature, getPayfastBaseUrl } from './payfast.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async initiate(bookingId: string, studentId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, student: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.studentId !== studentId) {
      throw new ForbiddenException('Only the student who booked this session can pay for it');
    }
    if (!booking.payment) {
      throw new NotFoundException('No payment record for this booking');
    }
    if (booking.payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${booking.payment.status.toLowerCase()}`);
    }

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const apiPublicUrl = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
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

    const signature = generatePayfastSignature(fields, process.env.PAYFAST_PASSPHRASE);

    return {
      actionUrl: `${getPayfastBaseUrl()}/eng/process`,
      fields: { ...fields, signature },
    };
  }

  async handleNotify(body: Record<string, string>) {
    const { signature, ...rest } = body;
    const expectedSignature = generatePayfastSignature(rest, process.env.PAYFAST_PASSPHRASE);

    if (signature !== expectedSignature) {
      this.logger.warn(`PayFast ITN signature mismatch for m_payment_id=${body.m_payment_id}`);
      throw new BadRequestException('Invalid signature');
    }

    const payment = await this.prisma.payment.findUnique({ where: { id: body.m_payment_id } });
    if (!payment) {
      this.logger.warn(`PayFast ITN for unknown payment id=${body.m_payment_id}`);
      return { received: true };
    }

    if (body.payment_status === 'COMPLETE') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, payfastRef: body.pf_payment_id },
      });
    } else if (body.payment_status === 'FAILED') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
    }

    return { received: true };
  }
}
