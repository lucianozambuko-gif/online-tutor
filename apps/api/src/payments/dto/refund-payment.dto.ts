import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class RefundPaymentDto {
  // Rand, not cents — converted to cents before calling PayFast. Omit for a
  // full refund of whatever hasn't already been refunded on this payment.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsString()
  @MinLength(3)
  reason: string;
}
