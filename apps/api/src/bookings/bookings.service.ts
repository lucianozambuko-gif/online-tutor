import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Role,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  VerificationStatus,
} from '../prisma/prisma-enums';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  DEFAULT_COMMISSION_PERCENT,
  MIN_HOURLY_RATE_ZAR,
} from '../common/pricing';

function getCommissionPercent(): number {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  const parsed = raw ? Number(raw) : DEFAULT_COMMISSION_PERCENT;
  return Number.isFinite(parsed) ? parsed : DEFAULT_COMMISSION_PERCENT;
}

const BOOKING_INCLUDE = {
  student: { select: { id: true, name: true, email: true } },
  tutor: { select: { id: true, name: true, email: true } },
  payment: true,
  review: true,
} as const;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, dto: CreateBookingDto) {
    if (new Date(dto.scheduledAt).getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const tutor = await this.prisma.user.findFirst({
      where: { id: dto.tutorId, role: Role.TUTOR },
      include: { tutorProfile: true },
    });
    if (!tutor?.tutorProfile) {
      throw new NotFoundException('Tutor not found');
    }
    // Defense in depth: the public tutor listing already hides anyone not
    // approved, but this blocks a booking hitting the API directly too.
    if (tutor.tutorProfile.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'This tutor has not been approved for bookings yet',
      );
    }

    const hourlyRate = Number(tutor.tutorProfile.hourlyRate);
    // Defense in depth alongside the DTO's own @Min — a tutor who registered
    // before this floor existed, or was updated directly, shouldn't still be
    // bookable below it.
    if (hourlyRate < MIN_HOURLY_RATE_ZAR) {
      throw new ForbiddenException(
        `This tutor's rate is below the platform minimum of R${MIN_HOURLY_RATE_ZAR}/hr and can't be booked yet`,
      );
    }
    const amount =
      Math.round(hourlyRate * (dto.durationMinutes / 60) * 100) / 100;
    const platformFee =
      Math.round(amount * (getCommissionPercent() / 100) * 100) / 100;
    const tutorPayoutAmount = Math.round((amount - platformFee) * 100) / 100;

    return this.prisma.booking.create({
      data: {
        studentId,
        tutorId: dto.tutorId,
        subject: dto.subject,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes,
        mode: dto.mode,
        meetingUrl:
          dto.mode === 'ONLINE'
            ? `https://meet.jit.si/Lumen-${randomBytes(12).toString('hex')}`
            : null,
        payment: {
          create: {
            payerId: studentId,
            amount,
            platformFee,
            tutorPayoutAmount,
            method: PaymentMethod.PAYFAST,
            status: PaymentStatus.PENDING,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  }

  findMine(userId: string, role: Role) {
    const where =
      role === Role.STUDENT
        ? { studentId: userId }
        : role === Role.TUTOR
          ? { tutorId: userId }
          : {};

    return this.prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  // Admin-only: every booking on the platform, for oversight/support.
  adminList() {
    return this.prisma.booking.findMany({
      include: BOOKING_INCLUDE,
      orderBy: { scheduledAt: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    this.assertParticipant(booking, userId, role);
    return booking;
  }

  async accept(id: string, tutorId: string) {
    const booking = await this.requireBooking(id);
    if (booking.tutorId !== tutorId) {
      throw new ForbiddenException(
        'Only the assigned tutor can accept this booking',
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException(
        `Booking is ${booking.status.toLowerCase()}, not pending`,
      );
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
      include: BOOKING_INCLUDE,
    });
  }

  async decline(id: string, tutorId: string) {
    const booking = await this.requireBooking(id);
    if (booking.tutorId !== tutorId) {
      throw new ForbiddenException(
        'Only the assigned tutor can decline this booking',
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException(
        `Booking is ${booking.status.toLowerCase()}, not pending`,
      );
    }
    // A student can pay before the tutor responds, so a payment may already be
    // sitting here — same guard/cleanup as cancel() to avoid an orphaned PAID
    // payment on a declined booking, or leaving a PENDING one payable forever.
    return this.cancelAndClosePayment(booking);
  }

  async cancel(id: string, userId: string, role: Role) {
    const booking = await this.requireBooking(id);
    this.assertParticipant(booking, userId, role);

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new ConflictException(
        `Booking is already ${booking.status.toLowerCase()}`,
      );
    }
    return this.cancelAndClosePayment(booking);
  }

  async complete(id: string, userId: string, role: Role) {
    const booking = await this.requireBooking(id);
    this.assertParticipant(booking, userId, role);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException(
        'Only a confirmed booking can be marked complete',
      );
    }
    if (booking.payment?.status !== PaymentStatus.PAID) {
      throw new ConflictException(
        'Payment must be completed before the session can be marked complete',
      );
    }

    // The tutor's payout is calculated on the Payment row at booking time; a
    // scheduled payout job (not implemented yet) would batch COMPLETED
    // bookings with PAID payments into Payout records.
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
      include: BOOKING_INCLUDE,
    });
  }

  private async cancelAndClosePayment(
    booking: Awaited<ReturnType<BookingsService['requireBooking']>>,
  ) {
    if (booking.payment?.status === PaymentStatus.PAID) {
      throw new ConflictException(
        'This booking is already paid for. Raise a dispute or contact an admin for a refund.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (booking.payment && booking.payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      return tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
        include: BOOKING_INCLUDE,
      });
    });
  }

  private async requireBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private assertParticipant(
    booking: { studentId: string; tutorId: string },
    userId: string,
    role: Role,
  ) {
    if (role === Role.ADMIN) return;
    if (booking.studentId !== userId && booking.tutorId !== userId) {
      throw new ForbiddenException('You are not a participant in this booking');
    }
  }
}
