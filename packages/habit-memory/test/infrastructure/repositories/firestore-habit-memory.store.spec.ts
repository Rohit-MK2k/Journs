import { FirestoreHabitMemoryStore } from '@journ/habit-memory/infrastructure/repositories/firestore-habit-memory.store';
import { HabitMemory } from '@journ/habit-memory/domain/habit-memory';
import { getFirestore } from 'firebase-admin/firestore';

const getMock = jest.fn();
const setMock = jest.fn();

const docMock = jest.fn().mockReturnValue({
  get: getMock,
  set: setMock,
});

const collectionMock = jest.fn().mockReturnValue({
  doc: docMock,
});

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: collectionMock,
  }),
}));

describe('FirestoreHabitMemoryStore', () => {
  let store: FirestoreHabitMemoryStore;

  beforeEach(() => {
    store = new FirestoreHabitMemoryStore();
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target FirestoreHabitMemoryStore.save
   * @description Verifies that habit memory is persisted to users/{uid}/habitMemory/default.
   */
  it('should save habit memory to single doc users/{uid}/habitMemory/default', async () => {
    const memory: HabitMemory = {
      uid: 'u1',
      topics: ['topic1'],
      frequency: 'daily',
      tone: 'positive',
      updatedAt: new Date('2026-09-02T00:00:00.000Z'),
    };

    await store.save('u1', memory);

    expect(collectionMock).toHaveBeenCalledWith('users/u1/habitMemory');
    expect(docMock).toHaveBeenCalledWith('default');
    expect(setMock).toHaveBeenCalledWith(memory);
  });

  /**
   * @testType Unit Test
   * @target FirestoreHabitMemoryStore.get
   * @description Verifies that habit memory is retrieved from users/{uid}/habitMemory/default with Firestore Timestamp conversion.
   */
  it('should retrieve habit memory and convert Firestore timestamp to Date', async () => {
    const firestoreDate = new Date('2026-09-02T10:00:00.000Z');
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: 'u1',
        topics: ['work'],
        frequency: 'daily',
        tone: 'reflective',
        updatedAt: {
          toDate: () => firestoreDate,
        },
      }),
    });

    const result = await store.get('u1');

    expect(collectionMock).toHaveBeenCalledWith('users/u1/habitMemory');
    expect(docMock).toHaveBeenCalledWith('default');
    expect(result).not.toBeNull();
    expect(result?.uid).toBe('u1');
    expect(result?.updatedAt).toEqual(firestoreDate);
  });

  /**
   * @testType Unit Test
   * @target FirestoreHabitMemoryStore.get
   * @description Verifies that null is returned when the habit memory document does not exist.
   */
  it('should return null when document does not exist', async () => {
    getMock.mockResolvedValue({
      exists: false,
    });

    const result = await store.get('u2');

    expect(result).toBeNull();
  });
});
