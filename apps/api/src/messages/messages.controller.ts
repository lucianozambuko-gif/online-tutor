import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('bookings/:bookingId/messages')
  list(@Param('bookingId') bookingId: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.list(bookingId, user.sub, user.role);
  }

  @Post('bookings/:bookingId/messages')
  send(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.send(bookingId, user.sub, user.role, dto);
  }

  // Declared before ':id/flag' would be irrelevant here since the path
  // literals differ ("admin/flagged" vs "<id>/flag"), but kept first anyway
  // to match this codebase's convention of static routes before dynamic ones.
  @Get('messages/admin/flagged')
  @Roles(Role.ADMIN)
  adminListFlagged() {
    return this.messagesService.adminListFlagged();
  }

  @Patch('messages/:id/flag')
  flag(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.flag(id, user.sub, user.role);
  }
}
