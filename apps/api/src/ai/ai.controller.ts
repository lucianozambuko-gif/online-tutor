import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { imageUploadOptions } from '../common/upload';

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
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.aiService.sendMessage(user.sub, dto.content, image);
  }
}
