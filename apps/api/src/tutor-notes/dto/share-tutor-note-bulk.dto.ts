import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ShareTutorNoteBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[];
}
