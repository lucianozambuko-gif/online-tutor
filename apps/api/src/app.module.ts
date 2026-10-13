import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GroqModule } from './groq/groq.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardianConsentModule } from './guardian-consent/guardian-consent.module';
import { TutorsModule } from './tutors/tutors.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { NotesModule } from './notes/notes.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TutorNotesModule } from './tutor-notes/tutor-notes.module';
import { TutorStudentsModule } from './tutor-students/tutor-students.module';
import { PayoutsModule } from './payouts/payouts.module';
import { IssuesModule } from './issues/issues.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { EmailModule } from './email/email.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    // Global safety-net rate limit (100 req/min/IP). Individual endpoints —
    // auth in particular — set tighter limits with @Throttle() since this
    // default is too generous to stop credential stuffing on its own.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    EmailModule,
    GroqModule,
    AuthModule,
    UsersModule,
    GuardianConsentModule,
    TutorsModule,
    BookingsModule,
    PaymentsModule,
    AiModule,
    NotesModule,
    FlashcardsModule,
    QuizzesModule,
    DashboardModule,
    TutorNotesModule,
    TutorStudentsModule,
    PayoutsModule,
    IssuesModule,
    SubscriptionsModule,
    ReviewsModule,
    AuditLogModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
