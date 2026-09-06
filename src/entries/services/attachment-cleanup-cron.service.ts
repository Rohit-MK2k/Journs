import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PendingAttachmentRepository } from '../interfaces/pending-attachment-repository.interface';
import { StorageProvider } from '../../common/interfaces/storage-provider.interface';

@Injectable()
export class AttachmentCleanupCronService {
  private readonly logger = new Logger(AttachmentCleanupCronService.name);

  constructor(
    @Inject('PendingAttachmentRepository')
    private readonly pendingRepo: PendingAttachmentRepository,
    @Inject('StorageProvider')
    private readonly storageProvider: StorageProvider,
  ) {}

  /**
   * Daily cron job at 2:00 AM server time.
   * Scans and deletes all unconfirmed pending attachments created prior to 00:00:00 of the current day.
   */
  @Cron('0 2 * * *')
  async cleanupOrphanAttachments(): Promise<{ totalOrphans: number; cleanedCount: number }> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    this.logger.log(`Starting orphan attachments cleanup for items created before ${startOfToday.toISOString()}...`);

    let totalOrphans = 0;
    let cleanedCount = 0;

    try {
      const orphans = await this.pendingRepo.findOrphansBefore(startOfToday);
      totalOrphans = orphans.length;

      for (const orphan of orphans) {
        try {
          if (orphan.filePath) {
            await this.storageProvider.deleteFile(orphan.filePath);
          }
          await this.pendingRepo.delete(orphan.id);
          cleanedCount++;
        } catch (itemErr) {
          this.logger.error(`Failed to purge orphan attachment ${orphan.id} (path: ${orphan.filePath})`, itemErr);
        }
      }

      this.logger.log(`Orphan attachments cleanup completed. Purged ${cleanedCount}/${totalOrphans} files.`);
    } catch (err) {
      this.logger.error('Failed to run orphan attachments cleanup cron job', err);
    }

    return { totalOrphans, cleanedCount };
  }
}
