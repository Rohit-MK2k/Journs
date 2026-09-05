import { Entry } from '../../entries/domain/entry';
import { ChatResponse } from '../../chat/domain/chat-response';
import { EntryDraft } from '../../chat/domain/entry-draft';
import { ChatSession } from '../../chat/domain/chat-session';
import { HabitMemory } from '../../habit-memory/domain/habit-memory';

/** Abstract contract for AI operations (summarization, chat, context extraction, habit derivation). */
export interface AIProvider {
  /** Generate a 1-line summary of entry text for timeline display. */
  summarize(text: string): Promise<string>;

  /** Send a message within a chat session and get the AI response. */
  chat(session: ChatSession, message: string): Promise<ChatResponse>;

  /** Extract a journal-worthy draft from a conversation snippet. */
  extractContext(conversationSnippet: string): Promise<EntryDraft>;

  /** Derive habit patterns (topics, frequency, tone) from recent entries. */
  deriveHabitMemory(
    entries: Entry[],
  ): Promise<Omit<HabitMemory, 'uid' | 'updatedAt'>>;

  /** Extract 2-3 key phrases from a document that relate to a user's search query. */
  extractSemanticChips(query: string, documentText: string): Promise<string[]>;

  /** Generate a 1-line gist of the entry asynchronously. */
  generateSummary(text: string): Promise<string>;

  /** Process a conversational turn with the AI companion. */
  processChatTurn(history: import('../../chat/domain/chat-session').ChatMessage[], newText: string, contextEntries: Entry[]): Promise<{ replyText: string; extractedDraft?: string }>;
}
