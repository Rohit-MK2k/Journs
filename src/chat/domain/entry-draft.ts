/** A draft journal entry extracted from a chat conversation. */
export interface EntryDraft {
  text: string;
  /** The conversation snippet this draft was derived from. */
  sourceContext: string;
}
