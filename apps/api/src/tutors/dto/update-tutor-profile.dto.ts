import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { GradeLevel } from '../../prisma/prisma-enums';

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
  @IsString({ each: true })
  qualifications?: string[];

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
