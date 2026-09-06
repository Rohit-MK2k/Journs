import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, Equals, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentPhotoDto {
  @Equals('photo')
  type: 'photo';

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}

export class AttachmentVoiceDto {
  @Equals('voice')
  type: 'voice';

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}

export class AttachmentLocationDto {
  @Equals('location')
  type: 'location';

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  @IsNotEmpty()
  locationLabel: string;
}

export type AttachmentDto = AttachmentPhotoDto | AttachmentVoiceDto | AttachmentLocationDto;

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AttachmentPhotoDto, name: 'photo' },
        { value: AttachmentVoiceDto, name: 'voice' },
        { value: AttachmentLocationDto, name: 'location' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  attachments?: AttachmentDto[];
}

