import {
  IsDateString,
  IsEmail,
  IsIn,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../prisma/prisma-enums';
import { calculateAge, MINOR_AGE_CUTOFF } from '../../common/age';

// Admin accounts are provisioned separately (see prisma/seed.ts), not self-service.
const SELF_REGISTERABLE_ROLES = [Role.STUDENT, Role.TUTOR] as const;

function isMinorStudent(dto: RegisterDto): boolean {
  return (
    dto.role === Role.STUDENT &&
    !!dto.dateOfBirth &&
    calculateAge(new Date(dto.dateOfBirth)) < MINOR_AGE_CUTOFF
  );
}

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

  // Required for students so we can detect minors and require guardian consent.
  @ValidateIf((dto: RegisterDto) => dto.role === Role.STUDENT)
  @IsDateString()
  dateOfBirth?: string;

  @ValidateIf(isMinorStudent)
  @IsString()
  @MinLength(2)
  guardianName?: string;

  @ValidateIf(isMinorStudent)
  @IsEmail()
  guardianEmail?: string;
}
