import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentDto {
  @IsString()
  @IsIn(['voice', 'photo', 'location'])
  type: 'voice' | 'photo' | 'location';

  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  transcript?: string;

  @IsString()
  @IsOptional()
  locationLabel?: string;
}

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
