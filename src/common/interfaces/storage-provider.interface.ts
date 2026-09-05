export interface StorageProvider {
  /**
   * Generates a signed URL for direct client-to-storage upload.
   */
  generateUploadUrl(uid: string, contentType: string, extension: string): Promise<{ uploadUrl: string, publicUrl: string }>;
}
