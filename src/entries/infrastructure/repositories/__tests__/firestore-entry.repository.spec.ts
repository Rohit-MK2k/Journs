import { FirestoreEntryRepository } from '../firestore-entry.repository';
import { Entry } from '../../../domain/entry';
import { getFirestore } from 'firebase-admin/firestore';

const getMock = jest.fn();
const setMock = jest.fn();
const whereMock = jest.fn().mockReturnThis();
const orderByMock = jest.fn().mockReturnThis();

export const collectionMock = jest.fn().mockReturnValue({
  doc: jest.fn().mockReturnValue({
    get: getMock,
    set: setMock,
  }),
  where: whereMock,
  orderBy: orderByMock,
  get: getMock,
});

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: collectionMock,
  }),
}));

describe('FirestoreEntryRepository', () => {
  let repo: FirestoreEntryRepository;

  beforeEach(() => {
    repo = new FirestoreEntryRepository();
    jest.clearAllMocks();
  });

  it('should save entry to users subcollection', async () => {
    const entry: Entry = {
      id: 'e1',
      uid: 'u1',
      date: new Date('2026-09-02T00:00:00.000Z'),
      text: 'text',
      attachments: [],
      vectorIndexed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await repo.save('u1', entry);
    
    expect(collectionMock).toHaveBeenCalledWith('users/u1/entries');
  });
});
