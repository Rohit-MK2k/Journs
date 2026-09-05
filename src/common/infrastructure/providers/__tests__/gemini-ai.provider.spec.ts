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

  it('should summarize text', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'summary' });
    const result = await provider.summarize('long text');
    expect(result).toBe('summary');
    expect(mockGenerateContent).toHaveBeenCalled();
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

  it('should derive habit memory', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '{"topics":["a"],"frequency":"daily","tone":"sad"}' });
    const result = await provider.deriveHabitMemory([{ text: 'entry 1' } as any]);
    expect(result.topics).toEqual(['a']);
    expect(result.frequency).toBe('daily');
    expect(result.tone).toBe('sad');
  });

  it('should generate summary', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'A short summary.' });
    const res = await provider.generateSummary('Long entry text...');
    expect(res).toBe('A short summary.');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should process chat turn', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify({ replyText: 'Hi', extractedDraft: 'draft text' }) });
    const res = await provider.processChatTurn([], 'hello', []);
    expect(res.replyText).toBe('Hi');
    expect(res.extractedDraft).toBe('draft text');
  });
});
