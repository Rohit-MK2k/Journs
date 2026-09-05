import { FirebaseStorageProvider } from '../firebase-storage.provider';
import { getStorage } from 'firebase-admin/storage';

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn().mockReturnValue({
    bucket: jest.fn().mockReturnValue({
      name: 'test-bucket',
      file: jest.fn().mockReturnValue({
        getSignedUrl: jest.fn().mockResolvedValue(['http://mock-signed-url.com']),
      }),
    }),
  }),
}));

describe('FirebaseStorageProvider', () => {
  let provider: FirebaseStorageProvider;

  beforeEach(() => {
    provider = new FirebaseStorageProvider();
    jest.clearAllMocks();
  });

  it('should generate upload url', async () => {
    const res = await provider.generateUploadUrl('u1', 'image/jpeg', 'jpg');
    
    expect(res.uploadUrl).toBe('http://mock-signed-url.com');
    expect(res.publicUrl).toContain('https://storage.googleapis.com/test-bucket/users/u1/attachments/');
    expect(res.publicUrl).toContain('.jpg');
    
    const storage = getStorage();
    expect(storage.bucket).toHaveBeenCalled();
  });
});
