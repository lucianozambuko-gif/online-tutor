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
import { SetRecordingUrlDto } from './dto/set-recording-url.dto';
import {
  DEFAULT_COMMISSION_PERCENT,
  MIN_HOURLY_RATE_ZAR,
} from '../common/pricing';
import { AuditLogService } from '../audit-log/audit-log.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Students only ever see the actual recording link once they've paid for
  // it in the same PayFast transaction as the session — otherwise the raw
  // URL would leak to anyone who can view the booking at all. Tutors and
  // admins see it unredacted (their own session / support access).
  private redactRecording<
    T extends {
      recordingUrl: string | null;
      payment: { recordingRequested: boolean; status: PaymentStatus } | null;
    },
  >(booking: T, role: Role): T {
    if (role !== Role.STUDENT) return booking;
    const paidForRecording =
      booking.payment?.recordingRequested &&
      booking.payment.status === PaymentStatus.PAID;
    return paidForRecording ? booking : { ...booking, recordingUrl: null };
  }

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

    const start = new Date(dto.scheduledAt);
    const end = new Date(start.getTime() + dto.durationMinutes * 60_000);
    // Prisma can't compare scheduledAt + durationMinutes against a dynamic
    // value in a single where clause, so pull the small set of candidates
    // that could overlap (start before this one ends) and check each one's
    // own end time in memory.
    const candidates = await this.prisma.booking.findMany({
      where: {
        tutorId: dto.tutorId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        scheduledAt: { lt: end },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });
    const hasOverlap = candidates.some(
      (b) =>
        new Date(b.scheduledAt.getTime() + b.durationMinutes * 60_000) > start,
    );
    if (hasOverlap) {
      throw new ConflictException(
        'This tutor already has a booking that overlaps with the selected time',
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

  async findMine(userId: string, role: Role) {
    const where =
      role === Role.STUDENT
        ? { studentId: userId }
        : role === Role.TUTOR
          ? { tutorId: userId }
          : {};

    const bookings = await this.prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { scheduledAt: 'desc' },
    });
    return bookings.map((b) => this.redactRecording(b, role));
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
    return this.redactRecording(booking, role);
  }

  // Admin-only test helper: until the real 8x8 JaaS recording webhook is
  // wired up, this is how a recording URL gets attached to a booking so the
  // paid-download flow can be exercised end to end.
  async setRecordingUrl(
    adminId: string,
    bookingId: string,
    dto: SetRecordingUrlDto,
  ) {
    const booking = await this.requireBooking(bookingId);
    const result = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { recordingUrl: dto.recordingUrl },
      include: BOOKING_INCLUDE,
    });
    await this.auditLog.record(
      adminId,
      'BOOKING_RECORDING_URL_SET',
      'Booking',
      booking.id,
    );
    return result;
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
