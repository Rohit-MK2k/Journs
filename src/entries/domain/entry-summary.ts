/** Lightweight display model for the timeline list. */
export interface EntrySummary {
  id: string;
  date: Date;
  /** AI-generated 1-line gist of the entry. */
  preview: string;
  wordCount: number;
  hasAttachments: boolean;
}
