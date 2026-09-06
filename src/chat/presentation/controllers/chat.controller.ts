import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { ChatService } from '../../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { ConfirmDraftDto } from '../dto/confirm-draft.dto';
import { ConflictError } from '../../../common/errors';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  async startSession(@Req() req: any) {
    return this.chatService.startSession(req.user.uid);
  }

  @Post('message')
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto, @Res() res: any) {
    const mode = dto.mode || 'text';
    let response;
    try {
      response = await this.chatService.sendMessage(req.user.uid, dto.message, mode);
    } catch (err: any) {
      if (err instanceof ConflictError) {
        await this.chatService.startSession(req.user.uid);
        response = await this.chatService.sendMessage(req.user.uid, dto.message, mode);
      } else {
        throw err;
      }
    }
    
    // Simulate Server-Sent Events (SSE) streaming response over POST
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send chunks
    const chunk = JSON.stringify({ message: response.message, draft: response.draft });
    res.write(`data: ${chunk}\n\n`);
    res.end();
  }

  @Post('voice')
  async handleVoice(@Req() req: any) {
    // Future stub: Accepts audio blob, returns transcribed text & AI voice synthesis response
    return { status: 'Not Implemented', message: 'Voice parsing coming soon' };
  }

  @Post('draft/confirm')
  async confirmDraft(@Req() req: any, @Body() dto: ConfirmDraftDto) {
    return this.chatService.confirmDraftSave(req.user.uid, dto.draft, dto.target);
  }
}
