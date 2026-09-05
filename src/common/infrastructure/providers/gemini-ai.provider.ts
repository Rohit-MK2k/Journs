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

  async extractSemanticChips(query: string, documentText: string): Promise<string[]> {
    const prompt = `Extract exactly 3 concise tags/chips from the following journal entry that match this search query: "${query}". Output as a comma-separated list without quotes.\n\n${documentText}`;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      const text = response.text || '';
      return text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
    } catch (e) {
      this.logger.error('Failed to extract semantic chips', e);
      return ['semantic', 'match', query.split(' ')[0] || 'result'];
    }
  }

  async generateSummary(text: string): Promise<string> {
    const systemInstruction = "You are a journaling assistant. Read the following text and provide a very short, 1-line gist summary. Return only the summary text without quotes.";
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: text,
        config: { systemInstruction },
      });
      return response.text?.trim() || 'No summary generated.';
    } catch (e) {
      this.logger.error('Failed to generate summary', e);
      return 'No summary generated.';
    }
  }

  async processChatTurn(
    history: import('../../../chat/domain/chat-session').ChatMessage[],
    newText: string,
    contextEntries: Entry[]
  ): Promise<{ replyText: string; extractedDraft?: string }> {
    const contextString = contextEntries.length 
      ? `Relevant past journal entries context:\n${contextEntries.map((e, i) => `[Entry ${i+1}]: ${e.text}`).join('\n\n')}\n\n`
      : 'No specific relevant past entries.\n\n';

    const historyString = history.length
      ? `Conversation History:\n${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\n`
      : '';

    const systemInstruction = `You are an empathetic, insightful journaling companion. 
Use the provided context and history to respond thoughtfully to the user.
If the user shares something substantial that sounds like it should be saved as a journal entry, extract it into 'extractedDraft'. Otherwise, set it to null.
Respond strictly in JSON format matching the schema: { "replyText": string, "extractedDraft": string | null }`;

    const prompt = `${contextString}${historyString}USER: ${newText}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        replyText: parsed.replyText || 'I understand.',
        extractedDraft: parsed.extractedDraft || undefined,
      };
    } catch (e) {
      this.logger.error('Failed to process chat turn', e);
      return { replyText: 'Sorry, I am having trouble processing that.' };
    }
  }
}
