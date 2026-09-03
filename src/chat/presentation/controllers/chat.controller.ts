import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from '../../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { ConfirmDraftDto } from '../dto/confirm-draft.dto';
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';

@Controller('chat')
@UseGuards(FirebaseAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  async startSession(@Req() req: any) {
    return this.chatService.startSession(req.user.uid);
  }

  @Post('message')
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.uid, dto.message, dto.mode);
  }

  @Post('draft/confirm')
  async confirmDraft(@Req() req: any, @Body() dto: ConfirmDraftDto) {
    return this.chatService.confirmDraftSave(req.user.uid, dto.draft, dto.target);
  }
}
