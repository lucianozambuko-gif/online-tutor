import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, BookingStatus, PaymentStatus } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from '../notes/notes.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { TutorStudentsService } from '../tutor-students/tutor-students.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notesService: NotesService,
    private readonly flashcardsService: FlashcardsService,
    private readonly quizzesService: QuizzesService,
    private readonly tutorStudentsService: TutorStudentsService,
  ) {}

  @Get('student')
  @Roles(Role.STUDENT)
  async studentDashboard(@CurrentUser() user: JwtPayload) {
    const [
      notesCount,
      recentNotes,
      flashcardsCount,
      recentFlashcards,
      quizzesCount,
      recentQuizzes,
      upcomingCount,
      upcomingLessons,
    ] = await Promise.all([
      this.notesService.count(user.sub),
      this.notesService.recentSummary(user.sub),
      this.flashcardsService.count(user.sub),
      this.flashcardsService.recentSummary(user.sub),
      this.quizzesService.count(user.sub),
      this.quizzesService.recentSummary(user.sub),
      this.prisma.booking.count({ where: { studentId: user.sub, scheduledAt: { gte: new Date() } } }),
      this.prisma.booking.findMany({
        where: { studentId: user.sub, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
        include: { tutor: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      notes: { count: notesCount, recent: recentNotes },
      flashcards: { count: flashcardsCount, recent: recentFlashcards },
      quizzes: { count: quizzesCount, recent: recentQuizzes },
      lessons: { count: upcomingCount, upcoming: upcomingLessons },
    };
  }

  @Get('tutor')
  @Roles(Role.TUTOR)
  async tutorDashboard(@CurrentUser() user: JwtPayload) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [pendingRequests, roster, upcomingCount, upcomingSessions, monthPayments, recentRequests] =
      await Promise.all([
        this.prisma.booking.count({ where: { tutorId: user.sub, status: BookingStatus.PENDING } }),
        this.tutorStudentsService.roster(user.sub),
        this.prisma.booking.count({
          where: { tutorId: user.sub, status: BookingStatus.CONFIRMED, scheduledAt: { gte: new Date() } },
        }),
        this.prisma.booking.findMany({
          where: { tutorId: user.sub, status: BookingStatus.CONFIRMED, scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: 'asc' },
          take: 3,
          include: { student: { select: { id: true, name: true } } },
        }),
        this.prisma.payment.findMany({
          where: {
            status: PaymentStatus.PAID,
            booking: { tutorId: user.sub, status: BookingStatus.COMPLETED },
            createdAt: { gte: startOfMonth },
          },
          select: { tutorPayoutAmount: true },
        }),
        this.prisma.booking.findMany({
          where: { tutorId: user.sub, status: BookingStatus.PENDING },
          orderBy: { scheduledAt: 'asc' },
          take: 3,
          include: { student: { select: { id: true, name: true } } },
        }),
      ]);

    const earningsThisMonth = monthPayments.reduce((sum, p) => sum + Number(p.tutorPayoutAmount), 0);

    return {
      requests: { count: pendingRequests, recent: recentRequests },
      students: { count: roster.length, recent: roster.slice(0, 5) },
      sessions: { count: upcomingCount, upcoming: upcomingSessions },
      earnings: { thisMonth: earningsThisMonth },
    };
  }
}
