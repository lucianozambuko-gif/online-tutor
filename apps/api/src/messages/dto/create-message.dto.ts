import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  // Optional so a message can be attachment-only — MessagesService.send
  // requires at least one of body/attachment.
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;
}
