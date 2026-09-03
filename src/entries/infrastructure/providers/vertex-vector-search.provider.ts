import { VectorSearchProvider } from '../../interfaces/vector-search-provider.interface';
import { Entry } from '../../domain/entry';

export class VertexAIVectorSearchProvider implements VectorSearchProvider {
  async indexEntry(uid: string, entry: Entry): Promise<void> {
    // Mock implementation for indexing
    return Promise.resolve();
  }

  async semanticSearch(uid: string, query: string): Promise<Entry[]> {
    // Mock implementation for search
    return Promise.resolve([]);
  }

  async removeEntry(uid: string, entryId: string): Promise<void> {
    // Mock implementation for delete
    return Promise.resolve();
  }
}
