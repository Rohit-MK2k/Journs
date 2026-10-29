import { Entry } from './entry';

export interface VectorSearchResult {
  entry: Entry;
  /** Raw vector distance/score from the database. */
  distance: number;
}
