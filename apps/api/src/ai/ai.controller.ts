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
        { name: 'image', maxCount: 1 },
        { name: 'document', maxCount: 1 },
      ],
      aiAttachmentUploadOptions,
    ),
  )
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ) {
    return this.aiService.sendMessage(
      user.sub,
      dto.content,
      files.image?.[0],
      files.document?.[0],
    );
  }
}
