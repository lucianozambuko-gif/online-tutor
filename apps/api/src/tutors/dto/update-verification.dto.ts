import { IsEnum } from 'class-validator';
import { VerificationStatus } from '../../prisma/prisma-enums';

export class UpdateVerificationDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;
}
