import { IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class GenerateFlashcardsDto {
  @ValidateIf((o: GenerateFlashcardsDto) => !o.noteId)
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ValidateIf((o: GenerateFlashcardsDto) => !o.topic)
  @IsString()
  noteId?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  count?: number;
}
