import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  getMine(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getSummary(user.sub);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminList() {
    return this.subscriptionsService.adminList();
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  upgrade(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionsService.initiateUpgrade(user.sub, dto.plan);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  cancel(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.cancel(user.sub);
  }

  // Public: called server-to-server by PayFast, authenticated by signature.
  @Post('notify')
  @HttpCode(HttpStatus.OK)
  notify(@Body() body: Record<string, string>) {
    return this.subscriptionsService.handleNotify(body);
  }
}
