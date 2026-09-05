import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { EntryService } from '../../services/entry.service';
import { CreateEntryDto } from '../dto/create-entry.dto';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  async createEntry(@Req() req: any, @Body() dto: CreateEntryDto) {
    return this.entryService.createEntry(req.user.uid, dto.text, dto.attachments);
  }

  @Post('autosave')
  async autosaveEntry(
    @Req() req: any, 
    @Body('entryId') entryId: string,
    @Body('text') text: string,
    @Body('clientTimestamp') clientTimestampStr: string
  ) {
    const ts = clientTimestampStr ? new Date(clientTimestampStr) : new Date();
    return this.entryService.autosave(req.user.uid, entryId, text || '', ts);
  }

  @Get()
  async getTimeline(@Req() req: any) {
    // Basic pagination placeholder (getTimeline already returns array)
    const timeline = await this.entryService.getTimeline(req.user.uid);
    return {
      data: timeline,
      meta: {
        total: timeline.length,
      }
    };
  }
}
