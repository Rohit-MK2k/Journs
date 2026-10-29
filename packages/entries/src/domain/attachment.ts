/** Supported attachment types for journal entries. */
export type AttachmentType = 'voice' | 'photo' | 'location';

export interface BaseAttachment {
  id: string;
  entryId: string;
  type: AttachmentType;
  createdAt: Date;
}

export interface VoiceAttachment extends BaseAttachment {
  type: 'voice';
  url: string;
  duration?: number;
  transcript?: string;
}

export interface PhotoAttachment extends BaseAttachment {
  type: 'photo';
  url: string;
  width?: number;
  height?: number;
}

export interface LocationAttachment extends BaseAttachment {
  type: 'location';
  lat: number;
  lng: number;
  locationLabel?: string;
}

/** A file or metadata attachment on a journal entry. */
export type Attachment = VoiceAttachment | PhotoAttachment | LocationAttachment;

/** Input type for creating a new attachment. */
export type CreateAttachmentInput = Omit<VoiceAttachment, 'id' | 'entryId' | 'createdAt'> 
  | Omit<PhotoAttachment, 'id' | 'entryId' | 'createdAt'> 
  | Omit<LocationAttachment, 'id' | 'entryId' | 'createdAt'>
  | { type: AttachmentType; url: string; [key: string]: any };
