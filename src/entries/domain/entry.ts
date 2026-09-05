import { Attachment, CreateAttachmentInput } from './attachment';

/** A single journal entry, tied to one calendar day per user. */
export interface Entry {
  id: string;
  uid: string;
  date: Date;
  text: string;
  attachments: Attachment[];
  /** Whether this entry has been indexed in the vector search store. */
  vectorIndexed: boolean;
  /** Timestamp provided by the client for the most recent autosave to prevent race conditions. */
  lastAutosaveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Input type for creating a new journal entry. */
export type CreateEntryInput = Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'lastAutosaveAt'> & {
  attachments: CreateAttachmentInput[];
};
