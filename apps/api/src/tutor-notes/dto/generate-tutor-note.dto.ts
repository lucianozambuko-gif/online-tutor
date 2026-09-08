import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateTutorNoteDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsString()
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  // The tutor's rough bullet points / shorthand from the session — the AI
  // polishes this into a structured note rather than inventing content.
  @IsString()
  @MaxLength(4000)
  rawInput: string;
}
