import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Get('mine')
  @Roles(Role.STUDENT)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.reviewsService.listMine(user.sub);
  }

  // Declared before 'tutor/:tutorId' — otherwise Nest would match "admin/list"
  // with tutorId="admin" and this route would never be reached.
  @Get('admin/list')
  @Roles(Role.ADMIN)
  adminList() {
    return this.reviewsService.adminList();
  }

  @Get('tutor/:tutorId')
  listForTutor(@Param('tutorId') tutorId: string) {
    return this.reviewsService.listForTutor(tutorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  adminDelete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.reviewsService.adminDelete(user.sub, id);
  }
}
