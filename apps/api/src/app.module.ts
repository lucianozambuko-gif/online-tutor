import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardianConsentModule } from './guardian-consent/guardian-consent.module';
import { TutorsModule } from './tutors/tutors.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    GuardianConsentModule,
    TutorsModule,
    BookingsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
