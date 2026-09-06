import '@testing-library/jest-dom'

jest.mock('firebase/auth', () => {
  const onAuthStateChangedMock = jest.fn((authOrCb, cb) => {
    const callback = typeof authOrCb === 'function' ? authOrCb : cb;
    if (callback) callback({ uid: 'mock-user' });
    return () => {};
  });
  return {
    getAuth: jest.fn(() => ({
      currentUser: { uid: 'mock-user', getIdToken: jest.fn().mockResolvedValue('mock-token') },
      onAuthStateChanged: onAuthStateChangedMock,
    })),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    signInWithRedirect: jest.fn(),
    onAuthStateChanged: onAuthStateChangedMock,
  };
});

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
