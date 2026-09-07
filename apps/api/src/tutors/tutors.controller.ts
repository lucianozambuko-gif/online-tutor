import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { TutorsService } from './tutors.service';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('tutors')
@UseGuards(JwtAuthGuard)
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  findAll() {
    return this.tutorsService.findAll();
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR)
  getOwnProfile(@CurrentUser() user: JwtPayload) {
    return this.tutorsService.getOwnProfile(user.sub);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR)
  updateOwnProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTutorProfileDto,
  ) {
    return this.tutorsService.updateOwnProfile(user.sub, dto);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminList() {
    return this.tutorsService.adminList();
  }

  @Patch(':id/verification')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setVerification(@Param('id') id: string, @Body() dto: UpdateVerificationDto) {
    return this.tutorsService.setVerification(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tutorsService.findOne(id);
  }
}
