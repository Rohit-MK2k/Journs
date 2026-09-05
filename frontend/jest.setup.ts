import '@testing-library/jest-dom'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'mock-user', getIdToken: jest.fn().mockResolvedValue('mock-token') }
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
  headers: { get: () => null },
  json: async () => ([
    {
      id: "1",
      relativeDate: "YESTERDAY",
      fullDate: "Tuesday, September 3, 2024",
      aiSummary: "Mocked AI summary",
      snippet: "Mocked snippet",
      wordCount: 100,
      readTime: "1 min read",
      attachments: {}
    }
  ])
}) as jest.Mock;
