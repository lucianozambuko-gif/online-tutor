import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../prisma/prisma-enums';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.TUTOR)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateIssueDto) {
    return this.issuesService.create(user.sub, dto);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.TUTOR)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.issuesService.listMine(user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminList() {
    return this.issuesService.adminList();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issuesService.update(user.sub, id, dto);
  }
}
