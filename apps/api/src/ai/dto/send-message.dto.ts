import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  // Optional because a message can be just an attached image with no typed
  // text — the service rejects the request if both are empty.
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;
}
