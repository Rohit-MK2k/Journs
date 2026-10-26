export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  filePath: string;
  fileId: string;
}

export interface StorageProvider {
  /**
   * Generates a signed URL for direct client-to-storage upload.
   */
  generateUploadUrl(uid: string, contentType: string, extension: string): Promise<UploadUrlResult>;

  /**
   * Deletes a file from storage by its relative path.
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Generates a signed URL for reading/downloading a file from storage.
   */
  getSignedReadUrl(filePath: string): Promise<string>;
}
