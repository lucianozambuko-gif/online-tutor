import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TutorStudentsService } from './tutor-students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('tutor-students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TUTOR)
export class TutorStudentsController {
  constructor(private readonly tutorStudentsService: TutorStudentsService) {}

  @Get()
  roster(@CurrentUser() user: JwtPayload) {
    return this.tutorStudentsService.roster(user.sub);
  }

  @Get(':studentId')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.tutorStudentsService.findOne(user.sub, studentId);
  }
}
