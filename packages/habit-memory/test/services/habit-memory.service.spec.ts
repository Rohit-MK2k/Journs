import { HabitMemoryService } from '@journ/habit-memory/services/habit-memory.service';
import { HabitMemory } from '@journ/habit-memory/domain';
import { HabitMemoryStore } from '@journ/habit-memory/interfaces/habit-memory-store.interface';
import { Entry, EntryRepository } from '@journ/entries';
import { AIProvider } from '@journ/common';
import { ValidationError } from '@journ/common';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    uid: 'user-1',
    date: new Date('2026-09-02'),
    text: 'A day of reflection.',
    attachments: [],
    vectorIndexed: true,
    createdAt: new Date('2026-09-02T10:00:00'),
    updatedAt: new Date('2026-09-02T10:00:00'),
    ...overrides,
  };
}

function makeHabitMemory(overrides: Partial<HabitMemory> = {}): HabitMemory {
  return {
    uid: 'user-1',
    topics: ['work'],
    frequency: 'daily',
    tone: 'reflective',
    updatedAt: new Date('2026-09-01'),
    ...overrides,
  };
}

describe('HabitMemoryService', () => {
  let service: HabitMemoryService;
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
      deleteAll: jest.fn(),
    };

    habitStore = {
      get: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    aiProvider = {
      summarize: jest.fn(),
      chat: jest.fn(),
      extractContext: jest.fn(),
      deriveHabitMemory: jest.fn(),
      extractSemanticChips: jest.fn(),
      generateSummary: jest.fn(),
      processChatTurn: jest.fn(),
    };

    service = new HabitMemoryService(repo, habitStore, aiProvider);
  });

  describe('refreshMemory', () => {
    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that habit memory is derived from recent entries via AIProvider and saved to HabitMemoryStore.
     */
    it('should derive habit memory from recent entries and save it', async () => {
      const entries = [
        makeEntry({ id: 'e-1', text: 'Work was intense today.' }),
        makeEntry({ id: 'e-2', text: 'Went for a run.' }),
      ];
      repo.listRecent.mockResolvedValue(entries);
      aiProvider.deriveHabitMemory.mockResolvedValue({
        topics: ['work', 'fitness'],
        frequency: 'daily',
        tone: 'energetic',
      });

      const result = await service.refreshMemory('user-1');

      expect(result.uid).toBe('user-1');
      expect(result.topics).toEqual(['work', 'fitness']);
      expect(result.frequency).toBe('daily');
      expect(result.tone).toBe('energetic');
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(habitStore.save).toHaveBeenCalledWith('user-1', result);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that existing habit memory is returned when no recent entries exist without invoking AI derivation.
     */
    it('should return existing habit memory when no recent entries exist', async () => {
      const existing = makeHabitMemory();
      repo.listRecent.mockResolvedValue([]);
      habitStore.get.mockResolvedValue(existing);

      const result = await service.refreshMemory('user-1');

      expect(result).toEqual(existing);
      expect(aiProvider.deriveHabitMemory).not.toHaveBeenCalled();
      expect(habitStore.save).not.toHaveBeenCalled();
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that default empty habit memory structure is returned when no recent entries and no existing memory exist.
     */
    it('should return default habit memory when no entries and no existing memory', async () => {
      repo.listRecent.mockResolvedValue([]);
      habitStore.get.mockResolvedValue(null);

      const result = await service.refreshMemory('user-1');

      expect(result.uid).toBe('user-1');
      expect(result.topics).toEqual([]);
      expect(result.frequency).toBe('none');
      expect(result.tone).toBe('neutral');
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(aiProvider.deriveHabitMemory).not.toHaveBeenCalled();
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that refreshMemory throws a ValidationError when uid is an empty string.
     */
    it('should throw when uid is empty', async () => {
      await expect(service.refreshMemory(''))
        .rejects.toThrow(ValidationError);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that refreshMemory throws a ValidationError when uid is whitespace-only.
     */
    it('should throw when uid is whitespace only', async () => {
      await expect(service.refreshMemory('   '))
        .rejects.toThrow(ValidationError);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that recent entries query looks back approximately 30 days.
     */
    it('should look back 30 days for recent entries', async () => {
      repo.listRecent.mockResolvedValue([]);
      habitStore.get.mockResolvedValue(null);

      const before = new Date();
      await service.refreshMemory('user-1');

      const sinceArg = repo.listRecent.mock.calls[0][1] as Date;
      const daysDiff = (before.getTime() - sinceArg.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThanOrEqual(29.9);
      expect(daysDiff).toBeLessThanOrEqual(30.1);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that the service assigns uid and a valid updatedAt Date to the derived habit memory.
     */
    it('should set uid and updatedAt on the derived memory', async () => {
      repo.listRecent.mockResolvedValue([makeEntry()]);
      aiProvider.deriveHabitMemory.mockResolvedValue({
        topics: ['journaling'],
        frequency: 'weekly',
        tone: 'calm',
      });

      const before = new Date();
      const result = await service.refreshMemory('user-1');

      expect(result.uid).toBe('user-1');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.refreshMemory
     * @description Verifies that the derived habit memory is saved to the store with the target uid.
     */
    it('should save the habit memory to the store', async () => {
      repo.listRecent.mockResolvedValue([makeEntry()]);
      aiProvider.deriveHabitMemory.mockResolvedValue({
        topics: ['tech'],
        frequency: 'daily',
        tone: 'focused',
      });

      const result = await service.refreshMemory('user-1');

      expect(habitStore.save).toHaveBeenCalledTimes(1);
      expect(habitStore.save).toHaveBeenCalledWith('user-1', result);
    });
  });

  describe('getMemory', () => {
    /**
     * @testType Unit Test
     * @target HabitMemoryService.getMemory
     * @description Verifies that getMemory throws ValidationError when uid is empty or whitespace-only.
     */
    it('should throw ValidationError if uid is empty', async () => {
      await expect(service.getMemory('')).rejects.toThrow(ValidationError);
      await expect(service.getMemory('   ')).rejects.toThrow(ValidationError);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.getMemory
     * @description Verifies that getMemory returns the persisted habit memory from store for a valid uid.
     */
    it('should return habit memory from store', async () => {
      const memory = makeHabitMemory({ uid: 'user-1' });
      habitStore.get.mockResolvedValue(memory);

      const result = await service.getMemory('user-1');
      expect(habitStore.get).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(memory);
    });

    /**
     * @testType Unit Test
     * @target HabitMemoryService.getMemory
     * @description Verifies that getMemory returns null if no habit memory exists for the user.
     */
    it('should return null if store has no memory for user', async () => {
      habitStore.get.mockResolvedValue(null);

      const result = await service.getMemory('user-2');
      expect(habitStore.get).toHaveBeenCalledWith('user-2');
      expect(result).toBeNull();
    });
  });
});
