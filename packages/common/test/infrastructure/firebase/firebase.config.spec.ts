import { initializeFirebaseAdmin } from '../../../src/infrastructure/firebase/firebase.config';
import * as firebaseApp from 'firebase-admin/app';
import * as fs from 'fs';

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(),
  cert: jest.fn().mockReturnValue('mock-cert'),
}));

jest.mock('fs');

describe('initializeFirebaseAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target initializeFirebaseAdmin
   * @description Verifies that initializeFirebaseAdmin does not re-initialize the Firebase Admin SDK if an app instance already exists.
   */
  it('should not initialize if already initialized', () => {
    (firebaseApp.getApps as jest.Mock).mockReturnValue([{ name: 'default' }]);

    initializeFirebaseAdmin();

    expect(firebaseApp.initializeApp).not.toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target initializeFirebaseAdmin
   * @description Verifies that initializeFirebaseAdmin configures credentials from service account file when it exists on disk.
   */
  it('should initialize with cert when credentials file exists', () => {
    (firebaseApp.getApps as jest.Mock).mockReturnValue([]);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ project_id: 'test-proj' }));

    initializeFirebaseAdmin();

    expect(firebaseApp.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'test-proj',
      }),
    );
  });

  /**
   * @testType Unit Test
   * @target initializeFirebaseAdmin
   * @description Verifies that initializeFirebaseAdmin falls back to default GCP project ID when credentials file does not exist.
   */
  it('should initialize with default credentials when file does not exist', () => {
    (firebaseApp.getApps as jest.Mock).mockReturnValue([]);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    process.env.GCP_PROJECT_ID = 'test-gcp';

    initializeFirebaseAdmin();

    expect(firebaseApp.initializeApp).toHaveBeenCalledWith({
      projectId: 'test-gcp',
    });
  });
});
