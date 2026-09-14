import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { BookingStatus } from '../prisma/prisma-enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

// Shown alongside a review rather than the reviewer's full name — enough for
// a tutor/other students to tell reviews apart without a stranger's full
// identity being public.
function displayName(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const lastInitial = rest.length > 0 ? `${rest[rest.length - 1][0]}.` : '';
  return [first, lastInitial].filter(Boolean).join(' ');
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(studentId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.studentId !== studentId) {
      throw new ForbiddenException('This is not your booking to review');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'You can only review a session after it has been completed',
      );
    }

    const review = await this.createReviewRow(studentId, booking.tutorId, dto);
    await this.recomputeAvgRating(booking.tutorId);
    return review;
  }

  private async createReviewRow(
    studentId: string,
    tutorId: string,
    dto: CreateReviewDto,
  ) {
    try {
      return await this.prisma.review.create({
        data: {
          bookingId: dto.bookingId,
          studentId,
          tutorId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('You already reviewed this session');
      }
      throw err;
    }
  }

  private async recomputeAvgRating(tutorId: string) {
    const { _avg } = await this.prisma.review.aggregate({
      where: { tutorId },
      _avg: { rating: true },
    });

    await this.prisma.tutorProfile.update({
      where: { userId: tutorId },
      data: { avgRating: _avg.rating ?? null },
    });
  }

  async listForTutor(tutorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true } } },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      studentDisplayName: displayName(r.student.name),
    }));
  }

  listMine(studentId: string) {
    return this.prisma.review.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin-only moderation view — every review, with enough context (both
  // names, the booking subject) to judge whether one needs removing.
  adminList() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true } },
        tutor: { select: { id: true, name: true } },
        booking: { select: { id: true, subject: true } },
      },
    });
  }

  async adminDelete(adminId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({ where: { id } });
    await this.recomputeAvgRating(review.tutorId);
    await this.auditLog.record(adminId, 'REVIEW_DELETED', 'Review', id);
    return { deleted: true };
  }
}
