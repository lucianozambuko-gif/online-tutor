import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { GenerateNoteDto } from './dto/generate-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

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
}
