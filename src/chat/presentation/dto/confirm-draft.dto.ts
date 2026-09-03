import { IsString, IsNotEmpty, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DraftSaveTarget } from '../../domain/draft-save-target';

class DraftDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  sourceContext: string;
}

export class ConfirmDraftDto {
  @ValidateNested()
  @Type(() => DraftDto)
  @IsNotEmpty()
  draft: DraftDto;

  @IsString()
  @IsIn(['new', 'today'])
  target: DraftSaveTarget;
}
