import { IsString } from 'class-validator';

export class ShareTutorNoteDto {
  @IsString()
  bookingId: string;
}
