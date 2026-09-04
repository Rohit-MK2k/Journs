import { initializeFirebaseAdmin } from '../firebase.config';
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

  it('should not initialize if already initialized', () => {
    (firebaseApp.getApps as jest.Mock).mockReturnValue([{ name: 'default' }]);

    initializeFirebaseAdmin();

    expect(firebaseApp.initializeApp).not.toHaveBeenCalled();
  });

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
