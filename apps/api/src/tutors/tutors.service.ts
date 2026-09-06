import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../prisma/prisma-enums';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';

const TUTOR_LIST_SELECT = {
  id: true,
  name: true,
  tutorProfile: {
    select: {
      subjects: true,
      hourlyRate: true,
      bio: true,
      avgRating: true,
      verificationStatus: true,
    },
  },
} as const;

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { role: Role.TUTOR, status: UserStatus.ACTIVE },
      select: TUTOR_LIST_SELECT,
    });
  }

  async findOne(id: string) {
    const tutor = await this.prisma.user.findFirst({
      where: { id, role: Role.TUTOR, status: UserStatus.ACTIVE },
      select: TUTOR_LIST_SELECT,
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }
    return tutor;
  }

  async updateOwnProfile(userId: string, dto: UpdateTutorProfileDto) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }
    return this.prisma.tutorProfile.update({ where: { userId }, data: dto });
  }
}
