import { Controller, Post, Body, Get, Req, Param, Delete, Inject, Optional } from '@nestjs/common';
import { EntryService } from '../../services/entry.service';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { CreateAttachmentDto } from '../dto/create-attachment.dto';
import { StorageProvider } from '../../../common/interfaces/storage-provider.interface';
import { PendingAttachmentRepository } from '../../interfaces/pending-attachment-repository.interface';

@Controller('entries')
export class EntriesController {
  constructor(
    private readonly entryService: EntryService,
    @Inject('StorageProvider') private readonly storageProvider: StorageProvider,
    @Optional() @Inject('PendingAttachmentRepository') private readonly pendingRepo?: PendingAttachmentRepository,
  ) {}

  @Post()
  async createEntry(@Req() req: any, @Body() dto: CreateEntryDto) {
    return this.entryService.createEntry(req.user.uid, dto.text, dto.attachments as any);
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

  @Get(':id')
  async getEntry(@Req() req: any, @Param('id') id: string) {
    const entry = await this.entryService.getEntry(req.user.uid, id);
    if (entry && Array.isArray(entry.attachments)) {
      const signedAttachments = await Promise.all(
        entry.attachments.map(async (att) => {
          if (att.type === 'photo' || att.type === 'voice') {
            let filePath = (att as any).filePath;
            if (!filePath && att.url && att.url.includes('storage.googleapis.com')) {
              const parts = att.url.split('?')[0].split('attachments/');
              if (parts.length > 1) {
                filePath = `users/${req.user.uid}/attachments/${parts[1]}`;
              }
            }
            if (filePath && this.storageProvider && typeof this.storageProvider.getSignedReadUrl === 'function') {
              try {
                const signedUrl = await this.storageProvider.getSignedReadUrl(filePath);
                return { ...att, url: signedUrl, previewUrl: signedUrl };
              } catch {}
            }
          }
          return att;
        })
      );
      return { ...entry, attachments: signedAttachments };
    }
    return entry;
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
  ) {
    const result = await this.storageProvider.generateUploadUrl(req.user.uid, contentType, extension);
    if (this.pendingRepo && result.fileId) {
      await this.pendingRepo.create({
        id: result.fileId,
        uid: req.user.uid,
        filePath: result.filePath,
        publicUrl: result.publicUrl,
        contentType,
        createdAt: new Date(),
      }).catch(() => {});
    }
    return result;
  }

  @Delete('attachments/pending/:fileId')
  async deletePendingAttachment(
    @Req() req: any,
    @Param('fileId') fileId: string,
  ) {
    if (this.pendingRepo) {
      const pending = await this.pendingRepo.findById(fileId);
      if (pending && pending.uid === req.user.uid) {
        if (pending.filePath) {
          await this.storageProvider.deleteFile(pending.filePath).catch(() => {});
        }
        await this.pendingRepo.delete(fileId).catch(() => {});
      }
    }
    return { success: true };
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
