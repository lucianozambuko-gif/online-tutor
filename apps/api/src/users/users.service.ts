import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../prisma/prisma-enums';

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
  }) {
    const user = await this.prisma.user.create({ data });

    if (data.role === Role.STUDENT) {
      await this.prisma.studentProfile.create({
        data: { userId: user.id, subjectsOfInterest: [] },
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
}
