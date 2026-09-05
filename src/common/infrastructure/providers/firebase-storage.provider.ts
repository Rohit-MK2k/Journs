import { StorageProvider } from '../../interfaces/storage-provider.interface';
import { getStorage } from 'firebase-admin/storage';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class FirebaseStorageProvider implements StorageProvider {
  private readonly logger = new Logger(FirebaseStorageProvider.name);

  async generateUploadUrl(uid: string, contentType: string, extension: string): Promise<{ uploadUrl: string, publicUrl: string }> {
    try {
      const bucket = getStorage().bucket();
      const uuid = randomUUID();
      const filename = `users/${uid}/attachments/${uuid}.${extension}`;
      const file = bucket.file(filename);

      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      // Construct the public read URL assuming default bucket structure or signed read if private
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      return { uploadUrl, publicUrl };
    } catch (e) {
      this.logger.error('Failed to generate upload URL', e);
      throw e;
    }
  }
}
