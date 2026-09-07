import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IssueCategory } from '../../prisma/prisma-enums';

export class CreateIssueDto {
  @IsEnum(IssueCategory)
  category: IssueCategory;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description: string;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
