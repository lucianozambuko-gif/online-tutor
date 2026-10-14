import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SetRecordingUrlDto } from './dto/set-recording-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.findMine(user.sub, user.role);
  }

  // Declared before ':id' — otherwise Nest would match "admin" as an :id
  // param and this route would never be reached.
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminList() {
    return this.bookingsService.adminList();
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user.sub, user.role);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR)
  accept(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.accept(id, user.sub);
  }

  @Patch(':id/decline')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR)
  decline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.decline(id, user.sub);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.cancel(id, user.sub, user.role);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.complete(id, user.sub, user.role);
  }

  @Patch(':id/recording-url')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setRecordingUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SetRecordingUrlDto,
  ) {
    return this.bookingsService.setRecordingUrl(user.sub, id, dto);
  }
}
