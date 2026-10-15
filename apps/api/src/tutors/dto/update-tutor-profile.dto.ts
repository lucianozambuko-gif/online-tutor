import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BankAccountType, GradeLevel } from '../../prisma/prisma-enums';
import { MIN_HOURLY_RATE_ZAR } from '../../common/pricing';
import { SPECIFIC_GRADES } from '../../common/grades';

export class UpdateTutorProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: 'You can list up to 3 subjects' })
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(GradeLevel, { each: true })
  gradeLevels?: GradeLevel[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SPECIFIC_GRADES.length)
  @IsIn(SPECIFIC_GRADES, { each: true })
  specificGrades?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(MIN_HOURLY_RATE_ZAR, {
    message: `hourlyRate must be at least R${MIN_HOURLY_RATE_ZAR}`,
  })
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  branchCode?: string;

  @IsOptional()
  @IsEnum(BankAccountType)
  accountType?: BankAccountType;
}
