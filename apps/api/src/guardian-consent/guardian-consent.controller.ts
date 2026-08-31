import { Controller, Get, Param, Post } from '@nestjs/common';
import { GuardianConsentService } from './guardian-consent.service';

@Controller('guardian-consent')
export class GuardianConsentController {
  constructor(private readonly guardianConsentService: GuardianConsentService) {}

  @Get(':token')
  async find(@Param('token') token: string) {
    const request = await this.guardianConsentService.findByToken(token);
    return {
      studentName: request.student.name,
      guardianName: request.guardianName,
      guardianEmail: request.guardianEmail,
      status: request.status,
      expiresAt: request.expiresAt,
    };
  }

  @Post(':token/accept')
  accept(@Param('token') token: string) {
    return this.guardianConsentService.accept(token);
  }
}
