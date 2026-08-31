import { Module } from '@nestjs/common';
import { GuardianConsentService } from './guardian-consent.service';
import { GuardianConsentController } from './guardian-consent.controller';

@Module({
  controllers: [GuardianConsentController],
  providers: [GuardianConsentService],
  exports: [GuardianConsentService],
})
export class GuardianConsentModule {}
