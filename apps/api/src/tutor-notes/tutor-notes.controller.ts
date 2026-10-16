import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TutorNotesService } from './tutor-notes.service';
import { GenerateTutorNoteDto } from './dto/generate-tutor-note.dto';
import { ShareTutorNoteDto } from './dto/share-tutor-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { noteAttachmentUploadOptions } from '../common/upload';
import { generateNotePdf } from '../common/note-export';

@Controller('tutor-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TUTOR)
export class TutorNotesController {
  constructor(private readonly tutorNotesService: TutorNotesService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('attachment', noteAttachmentUploadOptions))
  generate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateTutorNoteDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.tutorNotesService.generate(user.sub, dto, attachment);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('studentId') studentId?: string,
  ) {
    return this.tutorNotesService.list(user.sub, studentId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tutorNotesService.findOne(user.sub, id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const note = await this.tutorNotesService.findOne(user.sub, id);
    const pdf = await generateNotePdf({
      title: note.topic,
      metaLine: `${note.student ? `About ${note.student.name}` : 'General note'} · ${new Date(note.createdAt).toLocaleDateString()}`,
      content: note.content,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${note.topic.replace(/[^\w\- ]/g, '').slice(0, 60) || 'note'}.pdf"`,
    );
    res.send(pdf);
  }

  @Post(':id/share')
  share(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ShareTutorNoteDto,
  ) {
    return this.tutorNotesService.share(user.sub, id, dto.bookingId);
  }
}
