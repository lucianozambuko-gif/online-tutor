import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../prisma/prisma-enums';

@Injectable()
export class TutorStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async roster(tutorId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { tutorId, status: { not: BookingStatus.CANCELLED } },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: 'desc' },
    });

    const byStudent = new Map<
      string,
      {
        student: { id: string; name: string; email: string };
        subjects: Set<string>;
        sessionCount: number;
        lastSession: Date | null;
        nextSession: Date | null;
      }
    >();

    const now = Date.now();
    for (const booking of bookings) {
      const entry = byStudent.get(booking.studentId) ?? {
        student: booking.student,
        subjects: new Set<string>(),
        sessionCount: 0,
        lastSession: null,
        nextSession: null,
      };
      entry.subjects.add(booking.subject);
      entry.sessionCount += 1;

      const isFuture = booking.scheduledAt.getTime() > now;
      if (isFuture && booking.status !== BookingStatus.COMPLETED) {
        if (!entry.nextSession || booking.scheduledAt < entry.nextSession) {
          entry.nextSession = booking.scheduledAt;
        }
      } else if (!entry.lastSession || booking.scheduledAt > entry.lastSession) {
        entry.lastSession = booking.scheduledAt;
      }

      byStudent.set(booking.studentId, entry);
    }

    return Array.from(byStudent.values())
      .map((entry) => ({
        student: entry.student,
        subjects: Array.from(entry.subjects),
        sessionCount: entry.sessionCount,
        lastSession: entry.lastSession,
        nextSession: entry.nextSession,
      }))
      .sort((a, b) => {
        const aTime = a.nextSession?.getTime() ?? a.lastSession?.getTime() ?? 0;
        const bTime = b.nextSession?.getTime() ?? b.lastSession?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  async findOne(tutorId: string, studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { tutorId, studentId },
      orderBy: { scheduledAt: 'desc' },
    });
    if (bookings.length === 0) {
      throw new ForbiddenException('You have no bookings with this student');
    }

    return { student, bookings };
  }
}
