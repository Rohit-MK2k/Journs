import { AttachmentCleanupCronService } from '../attachment-cleanup-cron.service';
import { PendingAttachmentRepository } from '../../interfaces/pending-attachment-repository.interface';
import { StorageProvider } from '../../../common/interfaces/storage-provider.interface';

describe('AttachmentCleanupCronService', () => {
  let service: AttachmentCleanupCronService;
  let mockPendingRepo: jest.Mocked<PendingAttachmentRepository>;
  let mockStorageProvider: jest.Mocked<StorageProvider>;

  beforeEach(() => {
    mockPendingRepo = {
      create: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue(undefined),
      deleteByUrlsOrPaths: jest.fn().mockResolvedValue(undefined),
      findOrphansBefore: jest.fn(),
      findById: jest.fn(),
    };

    mockStorageProvider = {
      generateUploadUrl: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getSignedReadUrl: jest.fn().mockResolvedValue('signed-url'),
    };

    service = new AttachmentCleanupCronService(mockPendingRepo, mockStorageProvider);
  });

  it('should clean up orphan files created before start of today', async () => {
    mockPendingRepo.findOrphansBefore.mockResolvedValueOnce([
      {
        id: 'orphan-1',
        uid: 'u1',
        filePath: 'users/u1/attachments/orphan-1.jpg',
        publicUrl: 'http://storage/orphan-1.jpg',
        createdAt: new Date('2026-09-04T10:00:00.000Z'),
      },
      {
        id: 'orphan-2',
        uid: 'u2',
        filePath: 'users/u2/attachments/orphan-2.mp3',
        publicUrl: 'http://storage/orphan-2.mp3',
        createdAt: new Date('2026-09-04T12:00:00.000Z'),
      },
    ]);

    const result = await service.cleanupOrphanAttachments();

    expect(result.totalOrphans).toBe(2);
    expect(result.cleanedCount).toBe(2);
    expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('users/u1/attachments/orphan-1.jpg');
    expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('users/u2/attachments/orphan-2.mp3');
    expect(mockPendingRepo.delete).toHaveBeenCalledWith('orphan-1');
    expect(mockPendingRepo.delete).toHaveBeenCalledWith('orphan-2');
  });

  it('should continue processing even if one file deletion fails', async () => {
    mockPendingRepo.findOrphansBefore.mockResolvedValueOnce([
      {
        id: 'fail-file',
        uid: 'u1',
        filePath: 'users/u1/attachments/fail.jpg',
        publicUrl: 'http://storage/fail.jpg',
        createdAt: new Date('2026-09-04T10:00:00.000Z'),
      },
      {
        id: 'success-file',
        uid: 'u1',
        filePath: 'users/u1/attachments/success.jpg',
        publicUrl: 'http://storage/success.jpg',
        createdAt: new Date('2026-09-04T12:00:00.000Z'),
      },
    ]);

    mockStorageProvider.deleteFile.mockRejectedValueOnce(new Error('GCS error'));

    const result = await service.cleanupOrphanAttachments();

    expect(result.totalOrphans).toBe(2);
    expect(result.cleanedCount).toBe(1);
    expect(mockPendingRepo.delete).toHaveBeenCalledWith('success-file');
  });
});
