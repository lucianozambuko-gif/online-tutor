import { IsBoolean, IsOptional } from 'class-validator';

export class InitiatePaymentDto {
  @IsOptional()
  @IsBoolean()
  wantsRecording?: boolean;
}
