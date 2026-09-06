import { AIProvider } from '../../interfaces/ai-provider.interface';
import { ChatResponse, ChatSession, EntryDraft } from '../../../chat/domain';
import { HabitMemory } from '../../../habit-memory/domain';
import { Entry } from '../../../entries/domain';
import { GoogleGenAI } from '@google/genai';
import { Logger, Inject, Injectable } from '@nestjs/common';

import { shouldSummarize } from '../../utils/summarization.util';

const JOURNAL_SUMMARIZATION_SYSTEM_PROMPT = `You are a journal summarization assistant.

Your task is to read a user's journal entry and summarize it into **one concise gist** that captures the main idea, important events, emotions, experiences, and reflections from the journal.

### Rules

* Produce **exactly one summary** for each journal entry.
* The summary must contain **20–30 words**. Never exceed 30 words or use fewer than 20 words.
* Capture the **overall essence** of the journal rather than summarizing every individual detail.
* Preserve the user's **intended meaning, emotions, context, and perspective**.
* Maintain the **user's first-person perspective** when appropriate. Do not unnecessarily rewrite the journal into third-person narration.
* Do not add information, assumptions, opinions, advice, or interpretations that are not present in the journal.
* Do not use direct quotations from the journal.
* Do not use quotation marks in the summary.
* Do not copy distinctive phrases or sentences from the journal unnecessarily; **paraphrase the content naturally**.
* Focus on the most important **events, feelings, thoughts, realizations, decisions, or reflections**.
* Include emotional context when it is meaningful to understanding the journal.
* Ignore minor or repetitive details unless they are important to the overall gist.
* Keep the summary faithful to the original journal, even if the journal is informal, emotional, fragmented, or grammatically imperfect.
* Do not exaggerate, dramatize, or make the journal sound more positive or negative than it actually is.
* Do not provide advice, analysis, judgment, or recommendations.
* Do not include headings, bullet points, labels, explanations, or commentary.
* Return **only the final summary**.

### Example

**Journal:**

Today was a pretty stressful day at work. I had a lot of tasks and couldn't finish everything I planned. I felt frustrated at first, but after talking to a friend, I realized I was putting too much pressure on myself. I decided to take things one step at a time tomorrow.

**Summary:**

I had a stressful day at work and felt frustrated about not finishing everything, but talking to a friend helped me realize I was putting too much pressure on myself, so I decided to take things one step at a time.

**Important:** The example above is provided **for demonstration purposes only** to illustrate the expected style, perspective, and level of conciseness. Do **not** reuse, reproduce, or closely imitate its sentences or wording when summarizing an actual journal. Always generate a new summary based solely on the provided journal entry.

### Input

The user's journal entry will be provided below.

### Output

Return **only one gist of the journal entry**, written from the user's perspective and containing **20–30 words**.`;

@Injectable()
export class GeminiAIProvider implements AIProvider {
  private readonly logger = new Logger(GeminiAIProvider.name);

  constructor(
    @Inject('GENAI_CLIENT') private readonly ai: GoogleGenAI,
  ) {}

  async summarize(text: string): Promise<string> {
    return this.generateSummary(text);
  }

  async chat(session: ChatSession, message: string): Promise<ChatResponse> {
    const habitsInfo = session.habitMemory.writingHabits
      ? `\nUser's Writing Habits:
- Structure: ${session.habitMemory.writingHabits.structure}
- Depth: ${session.habitMemory.writingHabits.depth}
- Timing: ${session.habitMemory.writingHabits.timing}
- Vocabulary: ${session.habitMemory.writingHabits.vocabulary}
Adapt your response length, cadence, and formatting style to mirror the user's natural habits.`
      : '';

    const systemInstruction = `You are a helpful journaling companion. 
The user's context/habit memory: 
Topics: ${session.habitMemory.topics.join(', ')}
Frequency: ${session.habitMemory.frequency}
Tone: ${session.habitMemory.tone}${habitsInfo}

If they share something significant, you may suggest saving it as a draft.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return {
      message: response.text || '...',
      draft: undefined, // Advanced: Tool calling could populate this if invoked
    };
  }

  async extractContext(conversationSnippet: string): Promise<EntryDraft> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Extract a meaningful journal entry from the following conversation snippet. Make it read like a first-person diary entry.\n\n${conversationSnippet}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return {
      text: response.text || '',
      sourceContext: conversationSnippet,
    };
  }

  async deriveHabitMemory(entries: Entry[]): Promise<Omit<HabitMemory, 'uid' | 'updatedAt'>> {
    const textCorpus = entries.map((e, idx) => {
      const timeStr = e.createdAt ? new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time';
      const dateStr = e.date ? new Date(e.date).toISOString().split('T')[0] : 'Unknown date';
      const wordCount = (e.text || '').trim().split(/\s+/).filter(Boolean).length;
      return `[Entry ${idx + 1} | Date: ${dateStr} | Time: ${timeStr} | Words: ${wordCount}]\n${e.text}`;
    }).join('\n\n---\n\n');

    const prompt = `Analyze these journal entries to understand both WHAT the user writes (topics, cadence, emotional tone) and HOW they write (structure/format, depth/length, timing routine, and vocabulary style).

Output strictly valid JSON matching this schema:
{
  "topics": string[],
  "frequency": string,
  "tone": string,
  "writingHabits": {
    "structure": string,
    "depth": string,
    "timing": string,
    "vocabulary": string
  }
}

Guidelines for writingHabits:
- structure: How entries are formatted (e.g., "Bulleted thoughts", "Structured paragraphs", "Stream of consciousness", "Short fragments")
- depth: Typical length and detail level (e.g., "Concise check-ins (~100-200 words)", "Deep long-form reflections", "Brief one-liners")
- timing: Inferred time of day routine from timestamps (e.g., "Late night (11 PM - 1 AM)", "Morning reflections", "Evenings", "Throughout the day")
- vocabulary: Tone and language style (e.g., "Casual and colloquial", "Analytical and structured", "Introspective and poetic", "Action-oriented")

Journal Entries:
${textCorpus}`;
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return {
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        frequency: parsed.frequency || 'unknown',
        tone: parsed.tone || 'neutral',
        writingHabits: parsed.writingHabits ? {
          structure: parsed.writingHabits.structure || 'Free-flowing paragraphs',
          depth: parsed.writingHabits.depth || 'Standard entries',
          timing: parsed.writingHabits.timing || 'Flexible',
          vocabulary: parsed.writingHabits.vocabulary || 'Natural',
        } : undefined,
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
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      const text = response.text || '';
      return text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
    } catch (e) {
      this.logger.error('Failed to extract semantic chips', e);
      return ['semantic', 'match', query.split(' ')[0] || 'result'];
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!shouldSummarize(text)) {
      return '';
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: text,
        config: { 
          systemInstruction: JOURNAL_SUMMARIZATION_SYSTEM_PROMPT,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      const result = response.text?.trim() || '';
      return result === 'No summary generated.' ? '' : result;
    } catch (e) {
      this.logger.error('Failed to generate summary', e);
      return '';
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
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
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
