import { StorageProvider, UploadUrlResult } from '../../interfaces/storage-provider.interface';
import { getStorage } from 'firebase-admin/storage';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class FirebaseStorageProvider implements StorageProvider {
  private readonly logger = new Logger(FirebaseStorageProvider.name);

  async generateUploadUrl(uid: string, contentType: string, extension: string): Promise<UploadUrlResult> {
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;
      const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
      const uuid = randomUUID();
      const filename = `users/${uid}/attachments/${uuid}.${extension}`;
      const file = bucket.file(filename);

      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      // Generate a signed read URL so client can load and preview private media without 403
      const [publicUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { uploadUrl, publicUrl, filePath: filename, fileId: uuid };
    } catch (e) {
      this.logger.error('Failed to generate upload URL', e);
      throw e;
    }
  }

  async getSignedReadUrl(filePath: string): Promise<string> {
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;
      const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
      const file = bucket.file(filePath);
      const [readUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return readUrl;
    } catch (e) {
      this.logger.error(`Failed to generate signed read URL for: ${filePath}`, e);
      throw e;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;
      const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }
    } catch (e) {
      this.logger.error(`Failed to delete file from storage: ${filePath}`, e);
      throw e;
    }
  }
}
