import { ChatService } from '../services/chat.service';
import { EntryDraft, ChatResponse } from '../domain';
import { Entry, EntryRepository } from '../../entries';
import { HabitMemory, HabitMemoryStore } from '../../habit-memory';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    uid: 'user-1',
    date: new Date('2026-09-02'),
    text: 'Existing entry.',
    attachments: [],
    vectorIndexed: false,
    createdAt: new Date('2026-09-02T10:00:00'),
    updatedAt: new Date('2026-09-02T10:00:00'),
    ...overrides,
  };
}

function makeHabitMemory(overrides: Partial<HabitMemory> = {}): HabitMemory {
  return {
    uid: 'user-1',
    topics: ['work', 'health'],
    frequency: 'daily',
    tone: 'reflective',
    updatedAt: new Date('2026-09-01'),
    ...overrides,
  };
}

describe('ChatService', () => {
  let service: ChatService;
  let repo: jest.Mocked<EntryRepository>;
  let habitStore: jest.Mocked<HabitMemoryStore>;
  let aiProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByDate: jest.fn(),
      listByUser: jest.fn(),
      listRecent: jest.fn(),
      delete: jest.fn(),
    };

    habitStore = {
      get: jest.fn(),
      save: jest.fn(),
    };

    aiProvider = {
      summarize: jest.fn(),
      chat: jest.fn(),
      extractContext: jest.fn(),
      deriveHabitMemory: jest.fn(),
    };

    service = new ChatService(repo, habitStore, aiProvider);
  });

  // --- startSession ---

  describe('startSession', () => {
    it('should create a session with habit memory', async () => {
      const memory = makeHabitMemory();
      habitStore.get.mockResolvedValue(memory);

      const session = await service.startSession('user-1');

      expect(session.uid).toBe('user-1');
      expect(session.habitMemory).toEqual(memory);
      expect(session.id).toBeDefined();
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it('should create a session with default habit memory when none exists', async () => {
      habitStore.get.mockResolvedValue(null);

      const session = await service.startSession('user-1');

      expect(session.habitMemory.uid).toBe('user-1');
      expect(session.habitMemory.topics).toEqual([]);
      expect(session.habitMemory.frequency).toBe('unknown');
      expect(session.habitMemory.tone).toBe('neutral');
    });

    it('should throw when uid is empty', async () => {
      await expect(service.startSession(''))
        .rejects.toThrow('uid must not be empty');
    });

    it('should generate a unique session ID', async () => {
      habitStore.get.mockResolvedValue(null);

      const s1 = await service.startSession('user-1');
      const s2 = await service.startSession('user-2');

      expect(s1.id).not.toBe(s2.id);
    });
  });

  // --- sendMessage ---

  describe('sendMessage', () => {
    beforeEach(async () => {
      habitStore.get.mockResolvedValue(makeHabitMemory());
      await service.startSession('user-1');
    });

    it('should send a message and return AI response (text mode)', async () => {
      const response: ChatResponse = { message: 'I hear you.' };
      aiProvider.chat.mockResolvedValue(response);

      const result = await service.sendMessage('user-1', 'I feel good today', 'text');

      expect(result).toEqual(response);
      expect(aiProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'user-1' }),
        'I feel good today',
      );
    });

    it('should send a message and return AI response (voice mode)', async () => {
      const response: ChatResponse = { message: 'Tell me more.' };
      aiProvider.chat.mockResolvedValue(response);

      const result = await service.sendMessage('user-1', 'spoken words', 'voice');

      expect(result).toEqual(response);
    });

    it('should return response with draft when AI detects journal-worthy moment', async () => {
      const draft: EntryDraft = {
        text: 'Got a promotion today.',
        sourceContext: 'user mentioned promotion',
      };
      const response: ChatResponse = {
        message: 'That sounds significant! Want to save this?',
        draft,
      };
      aiProvider.chat.mockResolvedValue(response);

      const result = await service.sendMessage('user-1', 'I got promoted!', 'text');

      expect(result.draft).toEqual(draft);
    });

    it('should throw when uid is empty', async () => {
      await expect(service.sendMessage('', 'hello', 'text'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when message is empty', async () => {
      await expect(service.sendMessage('user-1', '', 'text'))
        .rejects.toThrow('Message must not be empty');
    });

    it('should throw when message is whitespace only', async () => {
      await expect(service.sendMessage('user-1', '   ', 'text'))
        .rejects.toThrow('Message must not be empty');
    });

    it('should throw when mode is invalid', async () => {
      await expect(
        service.sendMessage('user-1', 'hello', 'invalid' as 'text'),
      ).rejects.toThrow("Invalid chat mode: invalid. Must be 'text' or 'voice'");
    });

    it('should throw when no active session exists', async () => {
      // user-2 never started a session
      await expect(service.sendMessage('user-2', 'hello', 'text'))
        .rejects.toThrow('No active chat session. Call startSession first');
    });
  });

  // --- draftEntryFromContext ---

  describe('draftEntryFromContext', () => {
    it('should extract and return an entry draft', async () => {
      const draft: EntryDraft = {
        text: 'Had a breakthrough at work.',
        sourceContext: 'conversation about work challenges',
      };
      aiProvider.extractContext.mockResolvedValue(draft);

      const result = await service.draftEntryFromContext('user-1', 'we talked about work');

      expect(result).toEqual(draft);
      expect(aiProvider.extractContext).toHaveBeenCalledWith('we talked about work');
    });

    it('should throw when uid is empty', async () => {
      await expect(service.draftEntryFromContext('', 'context'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when context is empty', async () => {
      await expect(service.draftEntryFromContext('user-1', ''))
        .rejects.toThrow('Context must not be empty');
    });

    it('should throw when context is whitespace only', async () => {
      await expect(service.draftEntryFromContext('user-1', '   '))
        .rejects.toThrow('Context must not be empty');
    });
  });

  // --- confirmDraftSave ---

  describe('confirmDraftSave', () => {
    const draft: EntryDraft = {
      text: 'Drafted journal text.',
      sourceContext: 'chat snippet',
    };

    it('should create new entry when target is "new"', async () => {
      const saved = makeEntry({ text: draft.text });
      repo.save.mockResolvedValue(saved);

      const result = await service.confirmDraftSave('user-1', draft, 'new');

      expect(result).toEqual(saved);
      expect(repo.save).toHaveBeenCalledWith('user-1', expect.objectContaining({
        uid: 'user-1',
        text: draft.text,
        attachments: [],
        vectorIndexed: false,
      }));
    });

    it('should append to today\'s entry when target is "today" and entry exists', async () => {
      const existing = makeEntry({ text: 'Morning thoughts.' });
      const updated = makeEntry({ text: 'Morning thoughts.\n\nDrafted journal text.' });
      repo.findByDate.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.confirmDraftSave('user-1', draft, 'today');

      expect(result).toEqual(updated);
      expect(repo.update).toHaveBeenCalledWith('user-1', existing.id, {
        text: 'Morning thoughts.\n\nDrafted journal text.',
      });
    });

    it('should create new entry when target is "today" but no entry exists', async () => {
      repo.findByDate.mockResolvedValue(null);
      const saved = makeEntry({ text: draft.text });
      repo.save.mockResolvedValue(saved);

      const result = await service.confirmDraftSave('user-1', draft, 'today');

      expect(result).toEqual(saved);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw when uid is empty', async () => {
      await expect(service.confirmDraftSave('', draft, 'new'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when draft text is empty', async () => {
      const emptyDraft: EntryDraft = { text: '', sourceContext: 'context' };
      await expect(service.confirmDraftSave('user-1', emptyDraft, 'new'))
        .rejects.toThrow('Draft text must not be empty');
    });

    it('should throw when draft text is whitespace only', async () => {
      const blankDraft: EntryDraft = { text: '   ', sourceContext: 'context' };
      await expect(service.confirmDraftSave('user-1', blankDraft, 'new'))
        .rejects.toThrow('Draft text must not be empty');
    });
  });
});
