import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

const REPORTER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateIssueDto) {
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: dto.bookingId,
          OR: [{ studentId: reporterId }, { tutorId: reporterId }],
        },
      });
      if (!booking) {
        throw new NotFoundException(
          "Booking not found, or it isn't one of yours",
        );
      }
    }

    return this.prisma.issueReport.create({
      data: {
        reporterId,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        bookingId: dto.bookingId,
      },
    });
  }

  listMine(reporterId: string) {
    return this.prisma.issueReport.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  adminList() {
    return this.prisma.issueReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: REPORTER_SELECT } },
    });
  }

  async update(id: string, dto: UpdateIssueDto) {
    const issue = await this.prisma.issueReport.findUnique({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Issue report not found');
    }

    return this.prisma.issueReport.update({
      where: { id },
      data: { status: dto.status, adminNotes: dto.adminNotes },
      include: { reporter: { select: REPORTER_SELECT } },
    });
  }
}
