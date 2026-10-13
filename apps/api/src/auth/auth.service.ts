import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { GuardianConsentService } from '../guardian-consent/guardian-consent.service';
import { EmailService } from '../email/email.service';
import {
  guardianConsentEmail,
  passwordResetEmail,
} from '../email/email.templates';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './jwt-payload.interface';
import { Role, UserStatus } from '../prisma/prisma-enums';
import { calculateAge, MINOR_AGE_CUTOFF } from '../common/age';

const SALT_ROUNDS = 10;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  passwordHash?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly guardianConsentService: GuardianConsentService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined;
    const isMinor =
      dto.role === Role.STUDENT &&
      !!dateOfBirth &&
      calculateAge(dateOfBirth) < MINOR_AGE_CUTOFF;

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role,
      dateOfBirth,
      status: isMinor ? UserStatus.PENDING_GUARDIAN_CONSENT : UserStatus.ACTIVE,
      grade: dto.grade,
      institutionType: dto.institutionType,
    });

    let guardianConsentLink: string | undefined;
    if (isMinor) {
      const request = await this.guardianConsentService.createRequest(
        user.id,
        dto.guardianName!,
        dto.guardianEmail!,
      );
      const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
      guardianConsentLink = `${webOrigin}/guardian-consent/${request.token}`;

      const { subject, html } = guardianConsentEmail({
        guardianName: dto.guardianName!,
        studentName: dto.name,
        consentUrl: guardianConsentLink,
      });
      await this.emailService.send({ to: dto.guardianEmail!, subject, html });
    }

    const session = this.buildSession(user);
    return {
      ...session,
      guardianConsentLink:
        process.env.NODE_ENV !== 'production' ? guardianConsentLink : undefined,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DELETED
    ) {
      throw new ForbiddenException('This account is no longer active');
    }

    return this.buildSession(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersService.updatePassword(userId, passwordHash);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Always report success, whether or not the account exists — revealing
    // the difference lets an attacker enumerate registered emails.
    if (!user) {
      this.logger.debug(
        `Password reset requested for unregistered email: ${dto.email}`,
      );
      return { success: true };
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      },
    });

    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const { subject, html } = passwordResetEmail({
      name: user.name,
      resetUrl: `${webOrigin}/reset-password/${token}`,
    });
    await this.emailService.send({ to: user.email, subject, html });

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'This reset link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersService.updatePassword(resetToken.userId, passwordHash);

    // Invalidate every outstanding reset token for this user, not just the
    // one used — otherwise an older, still-unused link stays valid after a
    // successful reset.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return { success: true };
  }

  private buildSession(user: UserRecord) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  }
}
