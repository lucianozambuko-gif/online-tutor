import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { attachmentUploadOptions } from '../common/upload';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('bookings/:bookingId/messages')
  list(@Param('bookingId') bookingId: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.list(bookingId, user.sub, user.role);
  }

  @Post('bookings/:bookingId/messages')
  @UseInterceptors(FileInterceptor('attachment', attachmentUploadOptions))
  send(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMessageDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.messagesService.send(
      bookingId,
      user.sub,
      user.role,
      dto,
      attachment,
    );
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

  // Student/tutor's own direct thread with Lumen admin (not tied to a
  // booking) — "Contact support"-style messaging.
  @Get('messages/me/admin')
  @Roles(Role.STUDENT, Role.TUTOR)
  listMyAdminMessages(@CurrentUser() user: JwtPayload) {
    return this.messagesService.listMyAdminMessages(user.sub);
  }

  @Post('messages/me/admin')
  @Roles(Role.STUDENT, Role.TUTOR)
  @UseInterceptors(FileInterceptor('attachment', attachmentUploadOptions))
  sendMyAdminMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMessageDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.messagesService.sendMyAdminMessage(user.sub, dto, attachment);
  }

  // Admin side: an inbox of every direct conversation, starting a new one
  // with a specific user, and reading/sending within one.
  @Get('messages/admin/conversations')
  @Roles(Role.ADMIN)
  adminListConversations() {
    return this.messagesService.adminListConversations();
  }

  @Post('messages/admin/conversations')
  @Roles(Role.ADMIN)
  adminStartConversation(@Body() dto: StartConversationDto) {
    return this.messagesService.adminStartConversation(dto.userId);
  }

  @Get('messages/admin/conversations/:id')
  @Roles(Role.ADMIN)
  adminListMessages(@Param('id') id: string) {
    return this.messagesService.adminListMessages(id);
  }

  @Post('messages/admin/conversations/:id')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('attachment', attachmentUploadOptions))
  adminSendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.messagesService.adminSendMessage(user.sub, id, dto, attachment);
  }
}
