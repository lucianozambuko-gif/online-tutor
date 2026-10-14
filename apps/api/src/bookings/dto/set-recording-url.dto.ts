import { IsUrl } from 'class-validator';

export class SetRecordingUrlDto {
  @IsUrl({ require_tld: false })
  recordingUrl: string;
}
