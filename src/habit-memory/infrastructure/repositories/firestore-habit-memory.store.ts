import { HabitMemoryStore } from '../../interfaces/habit-memory-store.interface';
import { HabitMemory } from '../../domain/habit-memory';
import { getFirestore } from 'firebase-admin/firestore';

export class FirestoreHabitMemoryStore implements HabitMemoryStore {
  private getDb() {
    return getFirestore();
  }

  async get(uid: string): Promise<HabitMemory | null> {
    // Only one doc per user
    const doc = await this.getDb().collection(`users/${uid}/habitMemory`).doc('default').get();
    
    if (!doc.exists) return null;
    
    const data = doc.data() as any;
    return {
      ...data,
      updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    };
  }

  async save(uid: string, memory: HabitMemory): Promise<void> {
    await this.getDb().collection(`users/${uid}/habitMemory`).doc('default').set(memory);
  }
}
