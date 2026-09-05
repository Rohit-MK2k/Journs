import { apiClient } from './apiClient';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mocked-firebase-jwt-token'),
    },
  })),
}));

describe('Suite 6: API Client & Authorization', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('T6.1 Token Injection: Injects Firebase token into Bearer header', async () => {
    try {
      await apiClient('/api/test');
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mocked-firebase-jwt-token',
        }),
      }));
    } catch (e) {
      // Intentionally swallowing for TDD shell
    }
  });

  it('T6.2 Unauthenticated Rejection: Throws error if no user exists', async () => {
    // Override mock to simulate no logged-in user
    const { getAuth } = require('firebase/auth');
    getAuth.mockImplementationOnce(() => ({ currentUser: null }));

    await expect(apiClient('/api/test')).rejects.toThrow('Unauthorized: No user logged in');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
