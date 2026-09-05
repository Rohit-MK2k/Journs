import '@testing-library/jest-dom'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'mock-user' }
  })),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb({ uid: 'mock-user' });
    return () => {};
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => ''),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock global fetch to prevent actual network calls during tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({})
}) as jest.Mock;
