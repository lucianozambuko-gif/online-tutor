import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateQuizDto) {
    return this.quizzesService.generate(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.quizzesService.list(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quizzesService.findOne(user.sub, id);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submit(user.sub, id, dto);
  }
}
