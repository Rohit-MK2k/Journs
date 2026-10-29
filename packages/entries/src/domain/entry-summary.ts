/** Lightweight display model for the timeline list. */
export interface EntrySummary {
  id: string;
  date: Date;
  /** AI-generated 1-line gist of the entry. */
  preview?: string;
  /** Excerpt of the original entry text. */
  snippet?: string;
  wordCount: number;
  hasAttachments: boolean;
}
