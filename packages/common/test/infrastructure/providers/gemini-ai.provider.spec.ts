import { GeminiAIProvider } from '../../../src/infrastructure/providers/gemini-ai.provider';
import { IChatSession, IEntry } from '../../../src/interfaces';

const mockGenerateContent = jest.fn().mockResolvedValue({ text: 'mocked response' });
const mockGenAiClient = {
  models: { generateContent: mockGenerateContent },
} as any;

describe('GeminiAIProvider', () => {
  let provider: GeminiAIProvider;

  beforeEach(() => {
    provider = new GeminiAIProvider(mockGenAiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.summarize
   * @description Verifies that summarization is triggered when the provided journal text contains more than 20 words.
   */
  it('should summarize text with >20 words', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'summary' });
    const longJournal = 'Today was a wonderful morning where I walked through the park, watched the sunrise, and reflected deeply on my personal growth and ongoing creative aspirations.';
    const result = await provider.summarize(longJournal);
    expect(result).toBe('summary');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.summarize
   * @description Verifies that summarization is skipped and returns an empty string when the text has 20 or fewer words.
   */
  it('should skip summarization when text has 20 or fewer words', async () => {
    const shortText = 'Only a few words here today.';
    const result = await provider.summarize(shortText);
    expect(result).toBe('');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.chat
   * @description Verifies that a conversational response is generated from the session context and user message.
   */
  it('should generate chat response', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'hello' });
    const session: IChatSession = {
      id: 's1',
      uid: 'u1',
      startedAt: new Date(),
      habitMemory: { uid: 'u1', updatedAt: new Date(), topics: [], frequency: 'low', tone: 'calm' },
    };
    const result = await provider.chat(session, 'hi');
    expect(result.message).toBe('hello');
  });

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.extractContext
   * @description Verifies extraction of relevant user context from unstructured snippets.
   */
  it('should extract context', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'extracted' });
    const result = await provider.extractContext('snippet');
    expect(result.text).toBe('extracted');
  });

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.deriveHabitMemory
   * @description Verifies parsing of structured habit insights including topics, frequency, tone, and writing habits from journal entries.
   */
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
    const sampleEntries: IEntry[] = [{ text: 'entry 1' } as any];
    const result = await provider.deriveHabitMemory(sampleEntries);
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

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.generateSummary
   * @description Verifies that valid natural text produces a summary while programming code blocks are rejected.
   */
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

  /**
   * @testType Unit Test
   * @target GeminiAIProvider.processChatTurn
   * @description Verifies processing of a chat turn returning both assistant reply text and extracted entry draft.
   */
  it('should process chat turn', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ replyText: 'Hi', extractedDraft: 'draft text' }),
    });
    const res = await provider.processChatTurn([], 'hello', []);
    expect(res.replyText).toBe('Hi');
    expect(res.extractedDraft).toBe('draft text');
  });
});
