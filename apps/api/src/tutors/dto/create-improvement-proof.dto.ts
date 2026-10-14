import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateImprovementProofDto {
  @IsNotEmpty()
  @MaxLength(120)
  studentName: string;

  @IsNotEmpty()
  @MaxLength(80)
  subject: string;

  @IsNotEmpty()
  @MaxLength(20)
  beforeMark: string;

  @IsNotEmpty()
  @MaxLength(20)
  afterMark: string;
}
