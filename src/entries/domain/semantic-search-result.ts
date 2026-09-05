import { Entry } from './entry';

export interface SemanticSearchResult {
  entry: Entry;
  /** Human-readable match percentage (0 to 100). */
  matchScore: number;
  /** 2-3 key phrases extracted from the document relating to the user's query. */
  semanticChips: string[];
}
