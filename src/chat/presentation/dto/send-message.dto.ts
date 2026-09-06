import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ChatMessageMode } from '../../domain/chat-message-mode';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'voice'])
  mode?: ChatMessageMode = 'text';
}
