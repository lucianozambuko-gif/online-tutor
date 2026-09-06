import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from '../notes/notes.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { QuizzesService } from '../quizzes/quizzes.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notesService: NotesService,
    private readonly flashcardsService: FlashcardsService,
    private readonly quizzesService: QuizzesService,
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
}
