jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    listUsers: jest.fn(),
  })),
}));

jest.mock('firebase-admin/firestore', () => {
  const getMock = jest.fn();
  const setMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const whereMock = jest.fn().mockReturnThis();
  const orderByMock = jest.fn().mockReturnThis();
  const limitMock = jest.fn().mockReturnThis();

  const docMock = jest.fn().mockReturnValue({
    get: getMock,
    set: setMock,
    update: updateMock,
    delete: deleteMock,
  });

  const collectionMock = jest.fn().mockReturnValue({
    doc: docMock,
    where: whereMock,
    orderBy: orderByMock,
    limit: limitMock,
    get: getMock,
    add: jest.fn(),
  });

  return {
    getFirestore: jest.fn(() => ({
      collection: collectionMock,
    })),
  };
});
