import { PendingAttachmentRepository } from '../../interfaces/pending-attachment-repository.interface';
import { PendingAttachment } from '../../domain/pending-attachment.entity';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export class FirestorePendingAttachmentRepository implements PendingAttachmentRepository {
  private getDb() {
    return getFirestore();
  }

  private getCollection() {
    return this.getDb().collection('pending_attachments');
  }

  async create(pending: PendingAttachment): Promise<void> {
    const createdAtTimestamp = pending.createdAt instanceof Date 
      ? Timestamp.fromDate(pending.createdAt) 
      : Timestamp.now();

    await this.getCollection().doc(pending.id).set({
      id: pending.id,
      uid: pending.uid,
      filePath: pending.filePath,
      publicUrl: pending.publicUrl,
      contentType: pending.contentType || null,
      createdAt: createdAtTimestamp,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().doc(id).delete();
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const batch = this.getDb().batch();
    for (const id of ids) {
      batch.delete(this.getCollection().doc(id));
    }
    await batch.commit();
  }

  async deleteByUrlsOrPaths(identifiers: string[]): Promise<void> {
    if (!identifiers || identifiers.length === 0) return;
    const batch = this.getDb().batch();
    const uniqueIdentifiers = Array.from(new Set(identifiers)).filter(Boolean);

    for (let i = 0; i < uniqueIdentifiers.length; i += 10) {
      const chunk = uniqueIdentifiers.slice(i, i + 10);
      const [byUrl, byPath, byId] = await Promise.all([
        this.getCollection().where('publicUrl', 'in', chunk).get(),
        this.getCollection().where('filePath', 'in', chunk).get(),
        this.getCollection().where('__name__', 'in', chunk).get(),
      ]);

      const seen = new Set<string>();
      [...byUrl.docs, ...byPath.docs, ...byId.docs].forEach(doc => {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          batch.delete(doc.ref);
        }
      });
    }

    await batch.commit();
  }

  async findOrphansBefore(date: Date): Promise<PendingAttachment[]> {
    const cutoffTimestamp = Timestamp.fromDate(date);
    const snapshot = await this.getCollection()
      .where('createdAt', '<', cutoffTimestamp)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        filePath: data.filePath,
        publicUrl: data.publicUrl,
        contentType: data.contentType,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
  }

  async findById(id: string): Promise<PendingAttachment | null> {
    const doc = await this.getCollection().doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      uid: data.uid,
      filePath: data.filePath,
      publicUrl: data.publicUrl,
      contentType: data.contentType,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  }
}
