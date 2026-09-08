import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { InstitutionType, Role } from '../../prisma/prisma-enums';
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

function isStudent(dto: RegisterDto): boolean {
  return dto.role === Role.STUDENT;
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

  // What grade/year the student is in — free text since it varies wildly
  // across school, college, varsity and online-institute study.
  @ValidateIf(isStudent)
  @IsString()
  @MinLength(1)
  grade?: string;

  @ValidateIf(isStudent)
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  // Not shown as a headline field anymore, but still required for students —
  // it's the only thing that lets us detect minors and require guardian consent.
  @ValidateIf(isStudent)
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
