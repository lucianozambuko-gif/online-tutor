import { IsBoolean } from 'class-validator';

export class UpdateTranscriptVerifiedDto {
  @IsBoolean()
  verified: boolean;
}
