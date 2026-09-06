import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
