import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionType, Role, UserStatus } from '../prisma/prisma-enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
    dateOfBirth?: Date;
    status?: UserStatus;
    grade?: string;
    institutionType?: InstitutionType;
  }) {
    const { grade, institutionType, ...userData } = data;
    const user = await this.prisma.user.create({ data: userData });

    if (data.role === Role.STUDENT) {
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          subjectsOfInterest: [],
          gradeLevel: grade,
          institutionType,
        },
      });
    } else if (data.role === Role.TUTOR) {
      await this.prisma.tutorProfile.create({
        data: {
          userId: user.id,
          subjects: [],
          qualifications: [],
          hourlyRate: 0,
        },
      });
    }

    return user;
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  setAvatar(id: string, avatarUrl: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }

  // Soft delete: flips status to DELETED rather than removing the row, since
  // Bookings/Payments/Messages etc. reference the user and a hard delete would
  // either fail on the foreign key or destroy that history. login() already
  // rejects DELETED accounts, so this alone is enough to lock the account out.
  async softDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
