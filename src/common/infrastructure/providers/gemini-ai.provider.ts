import { AIProvider } from '../../interfaces/ai-provider.interface';
import { ChatResponse, ChatSession, EntryDraft } from '../../../chat/domain';
import { HabitMemory } from '../../../habit-memory/domain';
import { Entry } from '../../../entries/domain';

export class GeminiAIProvider implements AIProvider {
  async summarize(text: string): Promise<string> {
    return 'Mock summary for: ' + text.substring(0, 10);
  }

  async chat(session: ChatSession, message: string): Promise<ChatResponse> {
    return {
      message: 'Mock chat response',
      draft: undefined,
    };
  }

  async extractContext(conversationSnippet: string): Promise<EntryDraft> {
    return {
      text: 'Mock context',
      sourceContext: conversationSnippet,
    };
  }

  async deriveHabitMemory(entries: Entry[]): Promise<Omit<HabitMemory, 'uid' | 'updatedAt'>> {
    return {
      topics: ['mock'],
      frequency: 'unknown',
      tone: 'neutral',
    };
  }
}
