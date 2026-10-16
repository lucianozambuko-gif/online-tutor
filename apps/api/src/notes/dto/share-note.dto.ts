import { IsString } from 'class-validator';

export class ShareNoteDto {
  @IsString()
  bookingId: string;
}
