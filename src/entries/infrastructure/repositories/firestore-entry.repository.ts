import { EntryRepository } from '../../interfaces/entry-repository.interface';
import { Entry, CreateEntryInput } from '../../domain/entry';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

export class FirestoreEntryRepository implements EntryRepository {
  private getDb() {
    return getFirestore();
  }

  private getCollection(uid: string) {
    return this.getDb().collection(`users/${uid}/entries`);
  }

  private mapDocToEntry(id: string, data: any): Entry {
    return {
      ...data,
      id,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    };
  }

  async deleteAll(uid: string): Promise<void> {
    const snapshot = await this.getCollection(uid).get();
    const batch = getFirestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async save(uid: string, input: CreateEntryInput): Promise<Entry> {
    const docRef = this.getCollection(uid).doc();
    const now = new Date();
    
    const entry: Entry = {
      ...input,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
      attachments: input.attachments.map(att => ({
        ...att,
        id: randomUUID(),
        entryId: docRef.id,
        createdAt: now,
      })) as any,
    };
    
    await docRef.set(entry);
    return entry;
  }

  async findById(uid: string, entryId: string): Promise<Entry | null> {
    const doc = await this.getDb().collection(`users/${uid}/entries`).doc(entryId).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as any;
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date)
    };
  }

  async findByDate(uid: string, date: Date): Promise<Entry | null> {
    // Note: Simple date search, assumes start-of-day query matching domain logic
    const snapshot = await this.getDb()
      .collection(`users/${uid}/entries`)
      .where('date', '==', date)
      .get();

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data() as any;
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date)
    };
  }

  async listByUser(uid: string): Promise<Entry[]> {
    const snapshot = await this.getDb()
      .collection(`users/${uid}/entries`)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        date: data.date.toDate ? data.date.toDate() : new Date(data.date)
      };
    });
  }

  async update(uid: string, entryId: string, updates: Partial<Entry>): Promise<Entry> {
    const docRef = this.getDb().collection(`users/${uid}/entries`).doc(entryId);
    await docRef.update(updates as any);
    const updated = await this.findById(uid, entryId);
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async listRecent(uid: string, since: Date): Promise<Entry[]> {
    const snapshot = await this.getDb()
      .collection(`users/${uid}/entries`)
      .where('date', '>=', since)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        date: data.date.toDate ? data.date.toDate() : new Date(data.date)
      };
    });
  }

  async delete(uid: string, entryId: string): Promise<void> {
    await this.getDb().collection(`users/${uid}/entries`).doc(entryId).delete();
  }
}
