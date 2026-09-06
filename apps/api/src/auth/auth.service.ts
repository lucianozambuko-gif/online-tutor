import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { GuardianConsentService } from '../guardian-consent/guardian-consent.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { Role, UserStatus } from '../prisma/prisma-enums';
import { calculateAge, MINOR_AGE_CUTOFF } from '../common/age';

const SALT_ROUNDS = 10;

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

      // No email provider is wired up yet — log the link so it's usable in dev,
      // and return it directly in non-production responses. Replace this with a
      // real email send once a provider is chosen.
      this.logger.log(
        `Guardian consent link for ${user.email}: ${guardianConsentLink}`,
      );
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
