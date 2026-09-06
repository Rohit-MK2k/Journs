import { VectorSearchProvider } from '../../interfaces/vector-search-provider.interface';
import { EntryRepository } from '../../interfaces/entry-repository.interface';
import { Entry, VectorSearchResult } from '../../domain';
import { GoogleGenAI } from '@google/genai';
import { Logger, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FirestoreCosineVectorSearchProvider implements VectorSearchProvider {
  private readonly logger = new Logger(FirestoreCosineVectorSearchProvider.name);

  constructor(
    @Inject('GENAI_CLIENT') private readonly ai: GoogleGenAI,
    @Inject('EntryRepository') private readonly entryRepo: EntryRepository,
  ) {}

  async indexEntry(uid: string, entry: Entry): Promise<void> {
    try {
      if (!entry.text || entry.text.trim().length === 0) {
        this.logger.warn(`Skipping vector indexing for entry ${entry.id}: empty text`);
        return;
      }

      const embedding = await this.embedText(entry.text);
      if (!embedding.length) {
        this.logger.warn(`Skipping vector indexing for entry ${entry.id}: embedding generation returned empty`);
        return;
      }

      await this.entryRepo.update(uid, entry.id, {
        embedding,
        vectorIndexed: true,
      });

      this.logger.log(`Indexed entry ${entry.id} with cosine vector for user ${uid}`);
    } catch (e) {
      this.logger.error(`Failed to index entry ${entry.id}`, e);
      throw e;
    }
  }

  async removeEntry(uid: string, entryId: string): Promise<void> {
    try {
      await this.entryRepo.update(uid, entryId, {
        embedding: undefined,
        vectorIndexed: false,
      }).catch(() => {});
      this.logger.log(`Removed cosine vector for entry ${entryId}`);
    } catch (e) {
      this.logger.error(`Failed to remove vector for entry ${entryId}`, e);
      throw e;
    }
  }

  async removeAll(uid: string): Promise<void> {
    this.logger.log(`Purged cosine vector index references for user ${uid}`);
  }

  async semanticSearch(uid: string, query: string): Promise<VectorSearchResult[]> {
    try {
      const queryEmbedding = await this.embedText(query);
      if (!queryEmbedding.length) {
        this.logger.warn('Skipping semantic search: query embedding generation returned empty');
        return [];
      }

      const entries = await this.entryRepo.listByUser(uid);
      const candidates = entries.filter(
        (e) => Array.isArray(e.embedding) && e.embedding.length > 0,
      );

      if (candidates.length === 0) {
        return [];
      }

      const scored = candidates.map((entry) => {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, entry.embedding!);
        const clampedSimilarity = Math.max(-1, Math.min(1, similarity));
        const distance = 1 - clampedSimilarity;

        return {
          entry,
          distance,
        };
      });

      scored.sort((a, b) => a.distance - b.distance);

      return scored.slice(0, 10);
    } catch (e) {
      this.logger.error('Failed to perform cosine semantic search', e);
      return [];
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
        config: {
          outputDimensionality: 768,
        },
      });
      return response.embeddings?.[0]?.values || [];
    } catch (e) {
      this.logger.error('Failed to generate embedding with gemini-embedding-2', e);
      return [];
    }
  }
}
