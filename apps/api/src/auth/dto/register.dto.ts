import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { Role } from '../../prisma/prisma-enums';

// Admin accounts are provisioned separately (see prisma/seed.ts), not self-service.
const SELF_REGISTERABLE_ROLES = [Role.STUDENT, Role.TUTOR] as const;

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsIn(SELF_REGISTERABLE_ROLES)
  role: (typeof SELF_REGISTERABLE_ROLES)[number];
}
