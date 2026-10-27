jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    deleteUser: jest.fn(),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        delete: jest.fn(),
      })),
    })),
  })),
}));
