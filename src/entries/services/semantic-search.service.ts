import { SemanticSearchResult } from '../domain';
import { VectorSearchProvider, EntryRepository } from '../interfaces';
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
    private readonly entryRepo?: EntryRepository,
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
        let entry = vr.entry;
        if (this.entryRepo) {
          const loaded = await this.entryRepo.findById(uid, vr.entry.id);
          if (loaded) {
            entry = loaded;
          }
        }

        // Generate summary if missing or previous failure string
        if ((!entry.summary || entry.summary === 'No summary generated.') && entry.text && entry.text.trim().length >= 10) {
          try {
            const generated = await this.aiProvider.generateSummary(entry.text);
            if (generated && generated !== 'No summary generated.') {
              entry = { ...entry, summary: generated };
              if (this.entryRepo) {
                await this.entryRepo.update(uid, entry.id, { summary: generated }).catch(() => {});
              }
            }
          } catch {}
        }

        // Map raw distance (e.g. 0 to 2 for cosine) to a percentage.
        // For cosine distance: 0 is exact match (100%), 2 is opposite (0%).
        // formula: score = Math.max(0, 100 - (distance * 50))
        const matchScore = Math.max(0, Math.min(100, Math.round(100 - (vr.distance * 50))));

        // Extract 2-3 key phrases based on the user's query
        let semanticChips: string[] = [];
        try {
          semanticChips = await this.aiProvider.extractSemanticChips(query, entry.text);
        } catch {
          semanticChips = [];
        }

        return {
          entry,
          matchScore,
          semanticChips,
        };
      })
    );

    // Sort by match score descending (highest first)
    return semanticResults.sort((a, b) => b.matchScore - a.matchScore);
  }
}
