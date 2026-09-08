import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { aiAttachmentUploadOptions } from '../common/upload';
import { MAX_FILES_PER_MESSAGE_CAP } from '../subscriptions/plan-limits';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('messages')
  async getMessages(@CurrentUser() user: JwtPayload) {
    const conversation = await this.aiService.getConversation(user.sub);
    return conversation.messages;
  }

  @Post('messages')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: MAX_FILES_PER_MESSAGE_CAP },
        { name: 'documents', maxCount: MAX_FILES_PER_MESSAGE_CAP },
      ],
      aiAttachmentUploadOptions,
    ),
  )
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    return this.aiService.sendMessage(
      user.sub,
      dto.content,
      files.images ?? [],
      files.documents ?? [],
    );
  }
}
