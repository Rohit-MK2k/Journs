import { FirebaseAuthProvider } from '../firebase-auth.provider';
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

  it('should delete user auth', async () => {
    await provider.deleteAccount('u1');
    expect(getAuth().deleteUser).toHaveBeenCalledWith('u1');
  });
});
