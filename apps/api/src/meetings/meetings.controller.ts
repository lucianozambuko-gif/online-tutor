import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../prisma/prisma-enums';
import { JaasService } from './jaas.service';

// Room opens this many minutes before scheduledAt…
const EARLY_JOIN_MIN = 15;
// …and stays joinable this long after the scheduled end.
const LATE_JOIN_MIN = 30;

const SA_DATETIME = new Intl.DateTimeFormat('en-ZA', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Johannesburg',
});

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jaas: JaasService,
  ) {}

  /**
   * Everything the browser needs to open the embedded 8x8 JaaS room for a
   * booking. Only that booking's tutor (moderator) and student (participant)
   * get a token, and the token only opens that one room.
   */
  @Get(':bookingId/token')
  async getToken(
    @CurrentUser() user: JwtPayload,
    @Param('bookingId') bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        student: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isTutor = booking.tutorId === user.sub;
    const isStudent = booking.studentId === user.sub;
    if (!isTutor && !isStudent) {
      throw new ForbiddenException('You are not part of this session');
    }
    if (booking.mode !== 'ONLINE') {
      throw new BadRequestException('This is an in-person session');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'The session room opens once the tutor has accepted the booking',
      );
    }

    const start = booking.scheduledAt.getTime();
    const end = start + booking.durationMinutes * 60_000;
    const opens = start - EARLY_JOIN_MIN * 60_000;
    const closes = end + LATE_JOIN_MIN * 60_000;
    const now = Date.now();

    if (now < opens) {
      throw new BadRequestException(
        `The room opens ${EARLY_JOIN_MIN} minutes before the session (${SA_DATETIME.format(booking.scheduledAt)})`,
      );
    }
    if (now > closes) throw new BadRequestException('This session has ended');

    const me = isTutor ? booking.tutor : booking.student;
    const room = this.jaas.roomForBooking(booking.id);

    return {
      domain: this.jaas.domain,
      roomName: this.jaas.fullRoomName(room),
      jwt: this.jaas.signToken(
        room,
        {
          id: me.id,
          name: me.name,
          email: me.email,
          avatar: me.avatarUrl ?? undefined,
          moderator: isTutor,
        },
        Math.max(600, Math.floor((closes - now) / 1000)),
      ),
      role: isTutor ? 'tutor' : 'student',
      subject: booking.subject,
      otherPartyName: isTutor ? booking.student.name : booking.tutor.name,
      endsAt: new Date(end).toISOString(),
    };
  }

  /**
   * Minutes the tutor and student were each actually in the room, built
   * from JaaS webhook events (so the browser can't fake it). Useful for
   * payouts and no-show disputes.
   */
  @Get(':bookingId/attendance')
  async attendance(
    @CurrentUser() user: JwtPayload,
    @Param('bookingId') bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (
      user.role !== Role.ADMIN &&
      booking.tutorId !== user.sub &&
      booking.studentId !== user.sub
    ) {
      throw new ForbiddenException();
    }

    const events = await this.prisma.meetingEvent.findMany({
      where: {
        bookingId,
        type: { in: ['PARTICIPANT_JOINED', 'PARTICIPANT_LEFT'] },
      },
      orderBy: { occurredAt: 'asc' },
    });

    const openSince = new Map<string, number>();
    const totalMs = new Map<string, number>();
    for (const e of events) {
      if (!e.userId) continue;
      const t = e.occurredAt.getTime();
      if (e.type === 'PARTICIPANT_JOINED') {
        if (!openSince.has(e.userId)) openSince.set(e.userId, t);
      } else if (openSince.has(e.userId)) {
        totalMs.set(
          e.userId,
          (totalMs.get(e.userId) ?? 0) + (t - openSince.get(e.userId)!),
        );
        openSince.delete(e.userId);
      }
    }
    // Still in the room — count up to now.
    for (const [uid, t] of openSince) {
      totalMs.set(uid, (totalMs.get(uid) ?? 0) + (Date.now() - t));
    }

    const minutes = (uid: string) =>
      Math.round((totalMs.get(uid) ?? 0) / 60_000);
    return {
      bookingId,
      tutorMinutes: minutes(booking.tutorId),
      studentMinutes: minutes(booking.studentId),
      meetingStartedAt: booking.meetingStartedAt,
      meetingEndedAt: booking.meetingEndedAt,
    };
  }
}
