import { FirestoreHabitMemoryStore } from '../firestore-habit-memory.store';
import { HabitMemory } from '../../../domain/habit-memory';
import { getFirestore } from 'firebase-admin/firestore';

const getMock = jest.fn();
const setMock = jest.fn();

const collectionMock = jest.fn().mockReturnValue({
  doc: jest.fn().mockReturnValue({
    get: getMock,
    set: setMock,
  }),
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

  it('should save habit memory to single doc', async () => {
    const memory: HabitMemory = {
      uid: 'u1',
      topics: ['topic1'],
      frequency: 'daily',
      tone: 'positive',
      updatedAt: new Date('2026-09-02T00:00:00.000Z'),
    };
    
    await store.save('u1', memory);
    
    expect(collectionMock).toHaveBeenCalledWith('users/u1/habitMemory');
  });
});
