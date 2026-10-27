/** Abstract contract for cascading entry repository purge. */
export interface EntryRepositoryPurge {
  deleteAll(uid: string): Promise<void>;
}

/** Abstract contract for cascading vector search index purge. */
export interface VectorSearchPurge {
  removeAll(uid: string): Promise<void>;
}
