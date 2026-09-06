import { SemanticSearchResult } from '../domain';
import { VectorSearchProvider } from '../interfaces';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';
import { ValidationError } from '../../common/errors';

/**
 * Business logic for mapping raw vector searches into enriched semantic search results
 * containing match scores and AI-extracted context chips.
 */
export class SemanticSearchService {
  constructor(
    private readonly vectorSearch: VectorSearchProvider,
    private readonly aiProvider: AIProvider,
  ) {}

  /**
   * Search for entries by semantic similarity, convert distances to match scores,
   * and extract semantic chips (keywords) for UI highlighting.
   */
  async search(uid: string, query: string): Promise<SemanticSearchResult[]> {
    if (!uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }
    if (!query.trim()) {
      throw new ValidationError('Search query must not be empty');
    }

    // 1. Get raw vector matches
    const vectorResults = await this.vectorSearch.semanticSearch(uid, query);

    if (vectorResults.length === 0) {
      return [];
    }

    // 2. Map and enrich each result concurrently
    const semanticResults = await Promise.all(
      vectorResults.map(async (vr) => {
        // Map raw distance (e.g. 0 to 2 for cosine) to a percentage.
        // For cosine distance: 0 is exact match (100%), 2 is opposite (0%).
        // formula: score = Math.max(0, 100 - (distance * 50))
        // (Assuming provider returns cosine distance. If it returns something else, provider handles it or we normalize here.)
        // We'll assume typical cosine distance for now.
        const matchScore = Math.max(0, Math.min(100, Math.round(100 - (vr.distance * 50))));

        // Extract 2-3 key phrases based on the user's query
        let semanticChips: string[] = [];
        try {
          semanticChips = await this.aiProvider.extractSemanticChips(query, vr.entry.text);
        } catch {
          semanticChips = [];
        }

        return {
          entry: vr.entry,
          matchScore,
          semanticChips,
        };
      })
    );

    // Sort by match score descending (highest first)
    return semanticResults.sort((a, b) => b.matchScore - a.matchScore);
  }
}
