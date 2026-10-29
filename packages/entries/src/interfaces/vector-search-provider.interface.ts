import { Entry } from '../domain/entry';
import { VectorSearchResult } from '../domain/vector-search-result';

/** Abstract contract for vector-based semantic search and indexing. */
export interface VectorSearchProvider {
  /** Embed and index an entry for semantic retrieval. */
  indexEntry(uid: string, entry: Entry): Promise<void>;

  /** Remove an entry from the vector index. */
  removeEntry(uid: string, entryId: string): Promise<void>;

  /** Remove all entries for a user from the vector index. */
  removeAll(uid: string): Promise<void>;

  /** Search entries by semantic similarity to a natural-language query. */
  semanticSearch(uid: string, query: string): Promise<VectorSearchResult[]>;
}
