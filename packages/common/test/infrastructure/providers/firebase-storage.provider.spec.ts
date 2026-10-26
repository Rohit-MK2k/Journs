import { FirebaseStorageProvider } from '../../../src/infrastructure/providers/firebase-storage.provider';
import { getStorage } from 'firebase-admin/storage';

jest.mock('firebase-admin/storage', () => {
  const fileInstance = {
    getSignedUrl: jest.fn().mockResolvedValue(['http://mock-signed-url.com']),
    exists: jest.fn().mockResolvedValue([true]),
    delete: jest.fn().mockResolvedValue([]),
  };
  return {
    getStorage: jest.fn().mockReturnValue({
      bucket: jest.fn().mockReturnValue({
        name: 'test-bucket',
        file: jest.fn().mockReturnValue(fileInstance),
      }),
    }),
  };
});

describe('FirebaseStorageProvider', () => {
  let provider: FirebaseStorageProvider;

  beforeEach(() => {
    provider = new FirebaseStorageProvider();
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target FirebaseStorageProvider.generateUploadUrl
   * @description Verifies generation of signed upload URL, public URL, unique file identifier, and expected GCS storage path.
   */
  it('should generate upload url', async () => {
    const res = await provider.generateUploadUrl('u1', 'image/jpeg', 'jpg');

    expect(res.uploadUrl).toBe('http://mock-signed-url.com');
    expect(res.publicUrl).toBe('http://mock-signed-url.com');
    expect(res.filePath).toMatch(/^users\/u1\/attachments\/[a-f0-9-]+\.jpg$/);
    expect(res.fileId).toBeDefined();

    const storage = getStorage();
    expect(storage.bucket).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target FirebaseStorageProvider.getSignedReadUrl
   * @description Verifies generation of a signed temporary read URL for a stored attachment file path.
   */
  it('should generate signed read url', async () => {
    const url = await provider.getSignedReadUrl('users/u1/attachments/file.jpg');
    expect(url).toBe('http://mock-signed-url.com');
  });

  /**
   * @testType Unit Test
   * @target FirebaseStorageProvider.deleteFile
   * @description Verifies deletion of an existing file from the cloud storage bucket.
   */
  it('should delete existing file', async () => {
    const storage = getStorage();
    const file = storage.bucket().file('users/u1/attachments/file.jpg');
    (file.exists as jest.Mock).mockResolvedValueOnce([true]);

    await provider.deleteFile('users/u1/attachments/file.jpg');
    expect(file.delete).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target FirebaseStorageProvider.deleteFile
   * @description Verifies that deletion is gracefully skipped if the target file does not exist in the bucket.
   */
  it('should skip delete if file does not exist', async () => {
    const storage = getStorage();
    const file = storage.bucket().file('users/u1/attachments/notfound.jpg');
    (file.exists as jest.Mock).mockResolvedValueOnce([false]);

    await provider.deleteFile('users/u1/attachments/notfound.jpg');
    expect(file.delete).not.toHaveBeenCalled();
  });
});
