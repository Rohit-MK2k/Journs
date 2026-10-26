import {
  IChatSession,
  IChatResponse,
  IEntryDraft,
  IHabitMemory,
  IEntry,
  IChatMessage,
  IChatTurnResponse,
} from './contracts';

/** Abstract contract for AI operations (summarization, chat, context extraction, habit derivation). */
export interface AIProvider {
  /** Generate a 1-line summary of entry text for timeline display. */
  summarize(text: string): Promise<string>;

  /** Send a message within a chat session and get the AI response. */
  chat(session: IChatSession, message: string): Promise<IChatResponse>;

  /** Extract a journal-worthy draft from a conversation snippet. */
  extractContext(conversationSnippet: string): Promise<IEntryDraft>;

  /** Derive habit patterns (topics, frequency, tone) from recent entries. */
  deriveHabitMemory(
    entries: IEntry[],
  ): Promise<Omit<IHabitMemory, 'uid' | 'updatedAt'>>;

  /** Extract 2-3 key phrases from a document that relate to a user's search query. */
  extractSemanticChips(query: string, documentText: string): Promise<string[]>;

  /** Generate a 1-line gist of the entry asynchronously. */
  generateSummary(text: string): Promise<string>;

  /** Process a conversational turn with the AI companion. */
  processChatTurn(
    history: IChatMessage[],
    newText: string,
    contextEntries: IEntry[],
  ): Promise<IChatTurnResponse>;
}
