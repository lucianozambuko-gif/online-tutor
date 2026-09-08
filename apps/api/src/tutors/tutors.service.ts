import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus, VerificationStatus } from '../prisma/prisma-enums';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';

const TUTOR_LIST_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  tutorProfile: {
    select: {
      subjects: true,
      gradeLevels: true,
      hourlyRate: true,
      bio: true,
      avgRating: true,
      verificationStatus: true,
      // Whether an admin has reviewed the transcript, not the document
      // itself — that stays private to the tutor and admin.
      transcriptVerified: true,
    },
  },
} as const;

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  // Public listing/lookup — only shows tutors an admin has approved, so an
  // unvetted account can't be found or booked just because it registered.
  findAll() {
    return this.prisma.user.findMany({
      where: {
        role: Role.TUTOR,
        status: UserStatus.ACTIVE,
        tutorProfile: { verificationStatus: VerificationStatus.APPROVED },
      },
      select: TUTOR_LIST_SELECT,
    });
  }

  async findOne(id: string) {
    const tutor = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.TUTOR,
        status: UserStatus.ACTIVE,
        tutorProfile: { verificationStatus: VerificationStatus.APPROVED },
      },
      select: TUTOR_LIST_SELECT,
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }
    return tutor;
  }

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }
    return profile;
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

  // Admin-only: every tutor regardless of verification status, so a reviewer
  // can see who's still waiting alongside who's already approved/rejected.
  // Includes the transcript itself (unlike the public select) so an admin
  // can actually review it before flipping transcriptVerified.
  adminList() {
    return this.prisma.user.findMany({
      where: { role: Role.TUTOR, status: UserStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tutorProfile: {
          select: {
            subjects: true,
            gradeLevels: true,
            hourlyRate: true,
            bio: true,
            verificationStatus: true,
            transcriptName: true,
            transcriptMimeType: true,
            transcriptData: true,
            transcriptVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setVerification(tutorId: string, dto: UpdateVerificationDto) {
    const tutor = await this.prisma.user.findFirst({
      where: { id: tutorId, role: Role.TUTOR },
      include: { tutorProfile: true },
    });
    if (!tutor?.tutorProfile) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.tutorProfile.update({
      where: { userId: tutorId },
      data: { verificationStatus: dto.status },
    });
  }

  async uploadTranscript(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return this.prisma.tutorProfile.update({
      where: { userId },
      data: {
        transcriptData: file.buffer.toString('base64'),
        transcriptMimeType: file.mimetype,
        transcriptName: file.originalname,
        // A fresh upload needs a fresh look before it counts as verified.
        transcriptVerified: false,
      },
    });
  }

  async setTranscriptVerified(tutorId: string, verified: boolean) {
    const tutor = await this.prisma.user.findFirst({
      where: { id: tutorId, role: Role.TUTOR },
      include: { tutorProfile: true },
    });
    if (!tutor?.tutorProfile) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.tutorProfile.update({
      where: { userId: tutorId },
      data: { transcriptVerified: verified },
    });
  }
}
