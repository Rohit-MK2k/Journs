import { IsString, IsEnum, IsOptional, IsNumber, IsUrl } from 'class-validator';

export class CreateAttachmentDto {
  @IsEnum(['voice', 'photo', 'location'])
  type: 'voice' | 'photo' | 'location';

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  transcript?: string;
}
