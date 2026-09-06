import { GeminiAIProvider } from '../gemini-ai.provider';
import { ChatSession } from '../../../../chat/domain';

const mockGenerateContent = jest.fn().mockResolvedValue({ text: 'mocked response' });
const mockGenAiClient = {
  models: { generateContent: mockGenerateContent }
} as any;

describe('GeminiAIProvider', () => {
  let provider: GeminiAIProvider;

  beforeEach(() => {
    provider = new GeminiAIProvider(mockGenAiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should summarize text with >20 words', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'summary' });
    const longJournal = 'Today was a wonderful morning where I walked through the park, watched the sunrise, and reflected deeply on my personal growth and ongoing creative aspirations.';
    const result = await provider.summarize(longJournal);
    expect(result).toBe('summary');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should skip summarization when text has 20 or fewer words', async () => {
    const shortText = 'Only a few words here today.';
    const result = await provider.summarize(shortText);
    expect(result).toBe('');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should generate chat response', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'hello' });
    const session: ChatSession = { id: 's1', uid: 'u1', startedAt: new Date(), habitMemory: { uid: 'u1', updatedAt: new Date(), topics: [], frequency: 'low', tone: 'calm' } };
    const result = await provider.chat(session, 'hi');
    expect(result.message).toBe('hello');
  });

  it('should extract context', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'extracted' });
    const result = await provider.extractContext('snippet');
    expect(result.text).toBe('extracted');
  });

  it('should derive habit memory with writing habits', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        topics: ['a'],
        frequency: 'daily',
        tone: 'sad',
        writingHabits: {
          structure: 'bullet points',
          depth: 'concise',
          timing: 'late night',
          vocabulary: 'casual',
        },
      }),
    });
    const result = await provider.deriveHabitMemory([{ text: 'entry 1' } as any]);
    expect(result.topics).toEqual(['a']);
    expect(result.frequency).toBe('daily');
    expect(result.tone).toBe('sad');
    expect(result.writingHabits).toEqual({
      structure: 'bullet points',
      depth: 'concise',
      timing: 'late night',
      vocabulary: 'casual',
    });
  });

  it('should generate summary for valid text and skip code', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'A short summary.' });
    const longJournal = 'Today was a wonderful morning where I walked through the park, watched the sunrise, and reflected deeply on my personal growth and ongoing creative aspirations.';
    const res = await provider.generateSummary(longJournal);
    expect(res).toBe('A short summary.');
    expect(mockGenerateContent).toHaveBeenCalled();

    mockGenerateContent.mockClear();
    const codeSnippet = '```typescript\nimport React from "react";\nconst x = 1;\n```';
    const codeRes = await provider.generateSummary(codeSnippet);
    expect(codeRes).toBe('');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should process chat turn', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify({ replyText: 'Hi', extractedDraft: 'draft text' }) });
    const res = await provider.processChatTurn([], 'hello', []);
    expect(res.replyText).toBe('Hi');
    expect(res.extractedDraft).toBe('draft text');
  });
});
