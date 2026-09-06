import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateNoteDto {
  @IsString()
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  sourceText?: string;
}
