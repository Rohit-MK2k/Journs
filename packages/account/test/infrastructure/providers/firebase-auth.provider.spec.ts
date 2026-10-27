import { FirebaseAuthProvider } from '@journ/account/infrastructure/providers/firebase-auth.provider';
import { getAuth } from 'firebase-admin/auth';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    deleteUser: jest.fn(),
  }),
}));

describe('FirebaseAuthProvider', () => {
  let provider: FirebaseAuthProvider;

  beforeEach(() => {
    provider = new FirebaseAuthProvider();
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target FirebaseAuthProvider.deleteAccount
   * @description Verifies that the auth provider delegates to Firebase Admin Auth to delete the specified user account by uid.
   */
  it('should delete user auth', async () => {
    await provider.deleteAccount('u1');
    expect(getAuth().deleteUser).toHaveBeenCalledWith('u1');
  });
});
