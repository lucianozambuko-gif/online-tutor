import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { MarkPayoutPaidDto } from './dto/mark-payout-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('me')
  @Roles(Role.TUTOR)
  mySummary(@CurrentUser() user: JwtPayload) {
    return this.payoutsService.mySummary(user.sub);
  }

  @Get()
  @Roles(Role.ADMIN)
  listAll() {
    return this.payoutsService.listAll();
  }

  @Post('run')
  @Roles(Role.ADMIN)
  run() {
    return this.payoutsService.run();
  }

  @Patch(':id/paid')
  @Roles(Role.ADMIN)
  markPaid(@Param('id') id: string, @Body() dto: MarkPayoutPaidDto) {
    return this.payoutsService.markPaid(id, dto);
  }
}
