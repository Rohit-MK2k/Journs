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
}
