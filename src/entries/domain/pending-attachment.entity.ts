export interface PendingAttachment {
  id: string;
  uid: string;
  filePath: string;
  publicUrl: string;
  contentType?: string;
  createdAt: Date;
}
