import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardianConsentModule } from './guardian-consent/guardian-consent.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, GuardianConsentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
