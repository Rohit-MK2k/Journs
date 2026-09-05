import { FirestoreAccountRepository } from '../firestore-account.repository';
import { getFirestore } from 'firebase-admin/firestore';

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        delete: jest.fn(),
      }),
    }),
  }),
}));

describe('FirestoreAccountRepository', () => {
  let repo: FirestoreAccountRepository;

  beforeEach(() => {
    repo = new FirestoreAccountRepository();
    jest.clearAllMocks();
  });

  it('should delete user document', async () => {
    await repo.deleteUserDocument('u1');
    const db = getFirestore();
    expect(db.collection).toHaveBeenCalledWith('users');
    expect(db.collection('users').doc).toHaveBeenCalledWith('u1');
    expect(db.collection('users').doc('u1').delete).toHaveBeenCalled();
  });
});
