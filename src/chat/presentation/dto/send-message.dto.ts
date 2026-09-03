import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ChatMessageMode } from '../../domain/chat-message-mode';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(['text', 'voice'])
  mode: ChatMessageMode;
}
