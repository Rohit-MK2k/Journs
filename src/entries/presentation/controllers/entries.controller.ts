import { Controller, Post, Body, Get, Req, Param, Delete, Inject } from '@nestjs/common';
import { EntryService } from '../../services/entry.service';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { CreateAttachmentDto } from '../dto/create-attachment.dto';

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
    const timeline = await this.entryService.getTimeline(req.user.uid);
    return { data: timeline, meta: { total: timeline.length } };
  }

  @Post(':id/summary/generate')
  async generateSummary(@Req() req: any, @Param('id') id: string) {
    await this.entryService.generateAndSaveSummary(req.user.uid, id);
    return { success: true };
  }

  @Post('attachments/upload-url')
  async generateUploadUrl(
    @Req() req: any,
    @Body('contentType') contentType: string,
    @Body('extension') extension: string,
    @Inject('StorageProvider') storageProvider: import('../../../common/interfaces').StorageProvider
  ) {
    return storageProvider.generateUploadUrl(req.user.uid, contentType, extension);
  }

  @Post(':id/attachments')
  async addAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateAttachmentDto
  ) {
    return this.entryService.addAttachment(req.user.uid, id, dto as any);
  }

  @Delete(':id/attachments/:attachmentId')
  async removeAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    await this.entryService.removeAttachment(req.user.uid, id, attachmentId);
    return { success: true };
  }
}
