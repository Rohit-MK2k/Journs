import { FirestorePendingAttachmentRepository } from '@journ/entries/infrastructure/repositories/firestore-pending-attachment.repository';
import { PendingAttachment } from '@journ/entries/domain/pending-attachment.entity';

const setMock = jest.fn();
const deleteMock = jest.fn();
const getMock = jest.fn();
const whereMock = jest.fn().mockReturnThis();

const docMock = jest.fn().mockReturnValue({
  set: setMock,
  delete: deleteMock,
  get: getMock,
});

const collectionMock = jest.fn().mockReturnValue({
  doc: docMock,
  where: whereMock,
  get: getMock,
});

const batchDeleteMock = jest.fn();
const batchCommitMock = jest.fn().mockResolvedValue([]);
const batchMock = jest.fn().mockReturnValue({
  delete: batchDeleteMock,
  commit: batchCommitMock,
});

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: collectionMock,
    batch: batchMock,
  }),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000) }),
    now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }),
  },
}));

describe('FirestorePendingAttachmentRepository', () => {
  let repo: FirestorePendingAttachmentRepository;

  beforeEach(() => {
    repo = new FirestorePendingAttachmentRepository();
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.create
   * @description Verifies that a pending attachment record is created under pending_attachments.
   */
  it('should create a pending attachment document', async () => {
    const pending: PendingAttachment = {
      id: 'att-1',
      uid: 'u1',
      filePath: 'users/u1/attachments/att-1.jpg',
      publicUrl: 'http://storage/att-1.jpg',
      contentType: 'image/jpeg',
      createdAt: new Date('2026-09-05T10:00:00.000Z'),
    };

    await repo.create(pending);

    expect(collectionMock).toHaveBeenCalledWith('pending_attachments');
    expect(docMock).toHaveBeenCalledWith('att-1');
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'att-1',
      uid: 'u1',
      filePath: 'users/u1/attachments/att-1.jpg',
      publicUrl: 'http://storage/att-1.jpg',
    }));
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.delete
   * @description Verifies that a pending attachment is deleted by its ID.
   */
  it('should delete a pending attachment by id', async () => {
    await repo.delete('att-1');
    expect(docMock).toHaveBeenCalledWith('att-1');
    expect(deleteMock).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.deleteMany
   * @description Verifies that multiple pending attachments are deleted atomically in a batch.
   */
  it('should delete many pending attachments in a batch', async () => {
    await repo.deleteMany(['att-1', 'att-2']);
    expect(batchMock).toHaveBeenCalled();
    expect(batchDeleteMock).toHaveBeenCalledTimes(2);
    expect(batchCommitMock).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.findOrphansBefore
   * @description Verifies that orphan attachments created prior to a cutoff timestamp are retrieved.
   */
  it('should find orphans before a cutoff date', async () => {
    getMock.mockResolvedValueOnce({
      docs: [
        {
          id: 'orphan-1',
          data: () => ({
            uid: 'u1',
            filePath: 'users/u1/attachments/orphan-1.jpg',
            publicUrl: 'http://storage/orphan-1.jpg',
            contentType: 'image/jpeg',
            createdAt: { toDate: () => new Date('2026-09-04T00:00:00.000Z') },
          }),
        },
      ],
    });

    const cutoff = new Date('2026-09-06T00:00:00.000Z');
    const orphans = await repo.findOrphansBefore(cutoff);

    expect(whereMock).toHaveBeenCalledWith('createdAt', '<', expect.anything());
    expect(orphans).toHaveLength(1);
    expect(orphans[0].id).toBe('orphan-1');
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.deleteByUrlsOrPaths
   * @description Verifies that pending attachments matching specific URLs or storage paths are batch deleted.
   */
  it('should delete by urls or paths matching documents', async () => {
    getMock
      .mockResolvedValueOnce({ docs: [{ id: 'match-1', ref: 'ref-1' }] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    await repo.deleteByUrlsOrPaths(['http://storage/match-1.jpg']);
    expect(batchDeleteMock).toHaveBeenCalledWith('ref-1');
    expect(batchCommitMock).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.findById
   * @description Verifies that a pending attachment document is retrieved by id.
   */
  it('should find pending attachment by id', async () => {
    getMock.mockResolvedValueOnce({
      exists: true,
      id: 'att-1',
      data: () => ({
        uid: 'u1',
        filePath: 'users/u1/attachments/att-1.jpg',
        publicUrl: 'http://storage/att-1.jpg',
        contentType: 'image/jpeg',
        createdAt: { toDate: () => new Date('2026-09-05T10:00:00.000Z') },
      }),
    });

    const result = await repo.findById('att-1');
    expect(docMock).toHaveBeenCalledWith('att-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('att-1');
    expect(result?.uid).toBe('u1');
  });

  /**
   * @testType Unit Test
   * @target FirestorePendingAttachmentRepository.findById
   * @description Verifies that findById returns null when the document does not exist.
   */
  it('should return null if pending attachment not found', async () => {
    getMock.mockResolvedValueOnce({
      exists: false,
    });

    const result = await repo.findById('non-existent');
    expect(result).toBeNull();
  });
});
