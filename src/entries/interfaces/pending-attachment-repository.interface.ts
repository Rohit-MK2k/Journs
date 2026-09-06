import { PendingAttachment } from '../domain/pending-attachment.entity';

export interface PendingAttachmentRepository {
  /**
   * Records a newly generated pending attachment upload.
   */
  create(pending: PendingAttachment): Promise<void>;

  /**
   * Deletes a pending attachment record by its ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes multiple pending attachments by their IDs.
   */
  deleteMany(ids: string[]): Promise<void>;

  /**
   * Deletes pending attachment records matching either their public URL or filePath.
   */
  deleteByUrlsOrPaths(identifiers: string[]): Promise<void>;

  /**
   * Finds all unconfirmed pending attachments created strictly before the specified timestamp.
   */
  findOrphansBefore(date: Date): Promise<PendingAttachment[]>;

  /**
   * Finds a pending attachment by its ID. Returns null if not found.
   */
  findById(id: string): Promise<PendingAttachment | null>;
}
