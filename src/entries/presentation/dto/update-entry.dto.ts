import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEntryDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
