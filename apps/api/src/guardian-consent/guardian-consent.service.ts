import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GuardianConsentStatus, UserStatus } from '../prisma/prisma-enums';

const CONSENT_EXPIRY_DAYS = 7;
const GUARDIAN_CONSENT_POLICY_VERSION = '1.0';

@Injectable()
export class GuardianConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(
    studentId: string,
    guardianName: string,
    guardianEmail: string,
  ) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.prisma.guardianConsentRequest.create({
      data: { studentId, guardianName, guardianEmail, token, expiresAt },
    });
  }

  async findByToken(token: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: { student: { select: { name: true } } },
    });

    if (!request) {
      throw new NotFoundException('Consent request not found');
    }

    if (
      request.status === GuardianConsentStatus.PENDING &&
      request.expiresAt < new Date()
    ) {
      await this.prisma.guardianConsentRequest.update({
        where: { id: request.id },
        data: { status: GuardianConsentStatus.EXPIRED },
      });
      request.status = GuardianConsentStatus.EXPIRED;
    }

    return request;
  }

  async accept(token: string) {
    const request = await this.findByToken(token);

    if (request.status !== GuardianConsentStatus.PENDING) {
      throw new BadRequestException(
        `This consent request is ${request.status.toLowerCase()} and can no longer be accepted`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.guardianConsentRequest.update({
        where: { id: request.id },
        data: {
          status: GuardianConsentStatus.CONSENTED,
          consentedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: request.studentId },
        data: {
          status: UserStatus.ACTIVE,
          guardianContact: request.guardianEmail,
        },
      }),
      this.prisma.policyAcceptance.upsert({
        where: {
          userId_policyType_version: {
            userId: request.studentId,
            policyType: 'GUARDIAN_CONSENT',
            version: GUARDIAN_CONSENT_POLICY_VERSION,
          },
        },
        update: {},
        create: {
          userId: request.studentId,
          policyType: 'GUARDIAN_CONSENT',
          version: GUARDIAN_CONSENT_POLICY_VERSION,
        },
      }),
    ]);

    return { success: true };
  }
}
