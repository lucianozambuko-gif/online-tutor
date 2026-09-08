import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // Declared before ':id' — otherwise Nest would match "me" as an :id param
  // and this route would never be reached.
  @Delete('me')
  @Roles(Role.STUDENT, Role.TUTOR)
  removeSelf(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.softDelete(currentUser.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string) {
    if (currentUser.sub === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    return this.usersService.softDelete(id);
  }
}
