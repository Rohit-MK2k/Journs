import { AIProvider } from '../../interfaces/ai-provider.interface';
import { ChatResponse, ChatSession, EntryDraft } from '../../../chat/domain';
import { HabitMemory } from '../../../habit-memory/domain';
import { Entry } from '../../../entries/domain';
import { GoogleGenAI } from '@google/genai';
import { Logger, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GeminiAIProvider implements AIProvider {
  private readonly logger = new Logger(GeminiAIProvider.name);

  constructor(
    @Inject('GENAI_CLIENT') private readonly ai: GoogleGenAI,
  ) {}

  async summarize(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Summarize the following journal entry into a single concise sentence for a timeline view:\n\n${text}`,
    });
    return response.text || 'No summary generated.';
  }

  async chat(session: ChatSession, message: string): Promise<ChatResponse> {
    const systemInstruction = `You are a helpful journaling companion. 
The user's context/habit memory: 
Topics: ${session.habitMemory.topics.join(', ')}
Frequency: ${session.habitMemory.frequency}
Tone: ${session.habitMemory.tone}

If they share something significant, you may suggest saving it as a draft.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: message,
      config: {
        systemInstruction,
      },
    });

    return {
      message: response.text || '...',
      draft: undefined, // Advanced: Tool calling could populate this if invoked
    };
  }

  async extractContext(conversationSnippet: string): Promise<EntryDraft> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Extract a meaningful journal entry from the following conversation snippet. Make it read like a first-person diary entry.\n\n${conversationSnippet}`,
    });

    return {
      text: response.text || '',
      sourceContext: conversationSnippet,
    };
  }

  async deriveHabitMemory(entries: Entry[]): Promise<Omit<HabitMemory, 'uid' | 'updatedAt'>> {
    const textCorpus = entries.map(e => e.text).join('\n---\n');
    const prompt = `Analyze these journal entries and output exactly valid JSON with three keys: "topics" (array of strings), "frequency" (string), "tone" (string).\n\n${textCorpus}`;
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return {
        topics: parsed.topics || [],
        frequency: parsed.frequency || 'unknown',
        tone: parsed.tone || 'neutral',
      };
    } catch (e) {
      this.logger.error('Failed to parse habit memory JSON', e);
      return { topics: [], frequency: 'unknown', tone: 'neutral' };
    }
  }
}
