import { IsDateString, IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';
import { BookingMode } from '../../prisma/prisma-enums';

export class CreateBookingDto {
  @IsString()
  tutorId: string;

  @IsString()
  @MinLength(2)
  subject: string;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  durationMinutes: number;

  @IsIn([BookingMode.ONLINE, BookingMode.IN_PERSON])
  mode: BookingMode;
}
