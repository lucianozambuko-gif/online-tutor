import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('flashcards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post('generate')
  generate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateFlashcardsDto,
  ) {
    return this.flashcardsService.generate(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.flashcardsService.list(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.flashcardsService.findOne(user.sub, id);
  }
}
