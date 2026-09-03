import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { EntryService } from '../../services/entry.service';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { FirebaseAuthGuard } from '../../../common/guards/firebase-auth.guard';

@Controller('entries')
@UseGuards(FirebaseAuthGuard)
export class EntriesController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  async createEntry(@Req() req: any, @Body() dto: CreateEntryDto) {
    return this.entryService.createEntry(req.user.uid, dto.text, dto.attachments);
  }

  @Get('timeline')
  async getTimeline(@Req() req: any) {
    return this.entryService.getTimeline(req.user.uid);
  }
}
