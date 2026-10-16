import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { NotesService } from './notes.service';
import { GenerateNoteDto } from './dto/generate-note.dto';
import { ShareNoteDto } from './dto/share-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { generateNotePdf } from '../common/note-export';

@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('generate')
  generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateNoteDto) {
    return this.notesService.generate(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notesService.list(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notesService.findOne(user.sub, id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const note = await this.notesService.findOne(user.sub, id);
    const pdf = await generateNotePdf({
      title: note.topic,
      metaLine: `${note.subject ?? 'General'} · ${new Date(note.createdAt).toLocaleDateString()}`,
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
    @Body() dto: ShareNoteDto,
  ) {
    return this.notesService.share(user.sub, id, dto.bookingId);
  }
}
