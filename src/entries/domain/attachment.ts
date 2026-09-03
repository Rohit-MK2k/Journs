/** Supported attachment types for journal entries. */
export type AttachmentType = 'voice' | 'photo' | 'location';

/** A file or metadata attachment on a journal entry. */
export interface Attachment {
  id: string;
  entryId: string;
  type: AttachmentType;
  url: string;
  /** Voice transcript, used internally by AI for search/summary. Never shown to user as "the entry". */
  transcript?: string;
  /** Human-readable location label. Only present when type is 'location'. */
  locationLabel?: string;
  createdAt: Date;
}

/** Input type for creating a new attachment. */
export type CreateAttachmentInput = Omit<Attachment, 'id' | 'entryId' | 'createdAt'>;
