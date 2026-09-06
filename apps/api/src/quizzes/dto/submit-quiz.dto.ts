import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class SubmitQuizDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  answers: number[];
}
