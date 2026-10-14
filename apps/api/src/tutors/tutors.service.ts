import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from '../prisma/prisma-enums';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { CreateImprovementProofDto } from './dto/create-improvement-proof.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EmailService } from '../email/email.service';
import { portfolioReminderEmail } from '../email/email.templates';

const TUTOR_LIST_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  tutorProfile: {
    select: {
      subjects: true,
      gradeLevels: true,
      qualifications: true,
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

// Public-safe shape of a verified improvement proof — no student name, no
// document. Just enough to back a "✓ Verified improvement" badge.
const PUBLIC_IMPROVEMENT_PROOF_SELECT = {
  id: true,
  subject: true,
  beforeMark: true,
  afterMark: true,
} as const;

@Injectable()
export class TutorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

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

  // Lets a student see when a tutor is already busy without exposing who
  // booked them or what for — just the time ranges.
  async getBusySlots(tutorId: string) {
    const tutor = await this.prisma.user.findFirst({
      where: {
        id: tutorId,
        role: Role.TUTOR,
        status: UserStatus.ACTIVE,
        tutorProfile: { verificationStatus: VerificationStatus.APPROVED },
      },
      select: { id: true },
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.booking.findMany({
      where: {
        tutorId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        scheduledAt: { gte: new Date() },
      },
      select: { scheduledAt: true, durationMinutes: true },
      orderBy: { scheduledAt: 'asc' },
    });
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

  async setVerification(
    adminId: string,
    tutorId: string,
    dto: UpdateVerificationDto,
  ) {
    const tutor = await this.prisma.user.findFirst({
      where: { id: tutorId, role: Role.TUTOR },
      include: { tutorProfile: true },
    });
    if (!tutor?.tutorProfile) {
      throw new NotFoundException('Tutor not found');
    }

    const result = await this.prisma.tutorProfile.update({
      where: { userId: tutorId },
      data: { verificationStatus: dto.status },
    });
    await this.auditLog.record(
      adminId,
      `TUTOR_VERIFICATION_${dto.status}`,
      'TutorProfile',
      tutorId,
    );

    if (dto.status === VerificationStatus.APPROVED) {
      const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
      const { subject, html } = portfolioReminderEmail({
        tutorName: tutor.name,
        profileUrl: `${webOrigin}/tutor/profile`,
      });
      await this.emailService.send({ to: tutor.email, subject, html });
    }

    return result;
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

  async setTranscriptVerified(
    adminId: string,
    tutorId: string,
    verified: boolean,
  ) {
    const tutor = await this.prisma.user.findFirst({
      where: { id: tutorId, role: Role.TUTOR },
      include: { tutorProfile: true },
    });
    if (!tutor?.tutorProfile) {
      throw new NotFoundException('Tutor not found');
    }

    const result = await this.prisma.tutorProfile.update({
      where: { userId: tutorId },
      data: { transcriptVerified: verified },
    });
    await this.auditLog.record(
      adminId,
      verified ? 'TRANSCRIPT_VERIFIED' : 'TRANSCRIPT_UNVERIFIED',
      'TutorProfile',
      tutorId,
    );
    return result;
  }

  // Public: only verified entries, and only the non-identifying fields —
  // see PUBLIC_IMPROVEMENT_PROOF_SELECT.
  async getVerifiedImprovementProofs(tutorId: string) {
    const tutor = await this.prisma.user.findFirst({
      where: {
        id: tutorId,
        role: Role.TUTOR,
        status: UserStatus.ACTIVE,
        tutorProfile: { verificationStatus: VerificationStatus.APPROVED },
      },
      select: { id: true },
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.improvementProof.findMany({
      where: { tutorId, verified: true },
      select: PUBLIC_IMPROVEMENT_PROOF_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tutor-only: their own submissions, every status, so they can see what's
  // still pending review.
  listMyImprovementProofs(tutorId: string) {
    return this.prisma.improvementProof.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadImprovementProof(
    tutorId: string,
    dto: CreateImprovementProofDto,
    file: Express.Multer.File,
  ) {
    return this.prisma.improvementProof.create({
      data: {
        tutorId,
        studentName: dto.studentName,
        subject: dto.subject,
        beforeMark: dto.beforeMark,
        afterMark: dto.afterMark,
        documentData: file.buffer.toString('base64'),
        documentMimeType: file.mimetype,
        documentName: file.originalname,
      },
    });
  }

  // Admin-only: every submission across every tutor, including the document
  // and the real student name — needed to actually review the proof.
  adminListImprovementProofs() {
    return this.prisma.improvementProof.findMany({
      include: { tutor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setImprovementProofVerified(
    adminId: string,
    id: string,
    verified: boolean,
  ) {
    const proof = await this.prisma.improvementProof.findUnique({
      where: { id },
    });
    if (!proof) {
      throw new NotFoundException('Improvement proof not found');
    }

    const result = await this.prisma.improvementProof.update({
      where: { id },
      data: { verified, verifiedAt: verified ? new Date() : null },
    });
    await this.auditLog.record(
      adminId,
      verified ? 'IMPROVEMENT_PROOF_VERIFIED' : 'IMPROVEMENT_PROOF_UNVERIFIED',
      'ImprovementProof',
      id,
    );
    return result;
  }
}
