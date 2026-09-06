import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class GenerateQuizDto {
  @ValidateIf((o: GenerateQuizDto) => !o.noteId)
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ValidateIf((o: GenerateQuizDto) => !o.topic)
  @IsString()
  noteId?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  count?: number;
}
