import { Entry, CreateEntryInput } from '../domain/entry';
import { Attachment } from '../domain/attachment';

/** Abstract contract for journal entry persistence operations. */
export interface EntryRepository {
  /** Persist a new entry. Implementation assigns id, createdAt, updatedAt. */
  save(
    uid: string,
    entry: CreateEntryInput,
  ): Promise<Entry>;

  /** Apply partial updates to an existing entry. */
  update(
    uid: string,
    entryId: string,
    updates: Partial<Pick<Entry, 'text' | 'attachments' | 'vectorIndexed' | 'lastAutosaveAt' | 'summary'>>,
  ): Promise<Entry>;

  /** Find a single entry by its ID. Returns null if not found. */
  findById(uid: string, entryId: string): Promise<Entry | null>;

  /** Find the entry for a specific calendar date. Returns null if none. */
  findByDate(uid: string, date: Date): Promise<Entry | null>;

  /** List all entries for a user, ordered newest-first. */
  listByUser(uid: string): Promise<Entry[]>;

  /** List entries created or updated since the given date. */
  listRecent(uid: string, since: Date): Promise<Entry[]>;

  /** Permanently delete an entry. */
  delete(uid: string, entryId: string): Promise<void>;

  /** Permanently delete all entries for a user (cascading deletion). */
  deleteAll(uid: string): Promise<void>;
}
