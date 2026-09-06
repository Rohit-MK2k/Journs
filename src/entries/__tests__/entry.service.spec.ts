import { EntryService } from '../services/entry.service';
import { Entry, Attachment } from '../domain';
import { EntryRepository } from '../interfaces/entry-repository.interface';
import { VectorSearchProvider } from '../interfaces/vector-search-provider.interface';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';
import { ValidationError, ConflictError, NotFoundError } from '../../common/errors';
function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    uid: 'user-1',
    date: new Date('2026-09-02'),
    text: 'Today was productive.',
    attachments: [],
    vectorIndexed: false,
    createdAt: new Date('2026-09-02T10:00:00'),
    updatedAt: new Date('2026-09-02T10:00:00'),
    ...overrides,
  };
}

describe('EntryService', () => {
  let service: EntryService;
  let repo: jest.Mocked<EntryRepository>;
  let aiProvider: jest.Mocked<AIProvider>;
  let vectorSearch: jest.Mocked<VectorSearchProvider>;

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

    aiProvider = {
      summarize: jest.fn(),
      chat: jest.fn(),
      extractContext: jest.fn(),
      deriveHabitMemory: jest.fn(),
      extractSemanticChips: jest.fn(),
      generateSummary: jest.fn(),
      processChatTurn: jest.fn(),
    };

    vectorSearch = {
      indexEntry: jest.fn().mockResolvedValue(undefined),
      removeEntry: jest.fn().mockResolvedValue(undefined),
      removeAll: jest.fn().mockResolvedValue(undefined),
      semanticSearch: jest.fn(),
    };

    service = new EntryService(repo, aiProvider, vectorSearch);
  });

  // --- createEntry ---

  describe('createEntry', () => {
    it('should create an entry with valid inputs', async () => {
      const saved = makeEntry();
      repo.save.mockResolvedValue(saved);
      repo.update.mockResolvedValue({ ...saved, vectorIndexed: true });

      const result = await service.createEntry('user-1', 'Today was productive.');

      expect(result).toEqual(saved);
      expect(repo.save).toHaveBeenCalledWith('user-1', expect.objectContaining({
        uid: 'user-1',
        text: 'Today was productive.',
        attachments: [],
        vectorIndexed: false,
      }));
    });

    it('should throw when uid is empty', async () => {
      await expect(service.createEntry('', 'some text'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw when uid is whitespace only', async () => {
      await expect(service.createEntry('   ', 'some text'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw when text is empty', async () => {
      await expect(service.createEntry('user-1', ''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw when text is whitespace only', async () => {
      await expect(service.createEntry('user-1', '   '))
        .rejects.toThrow(ValidationError);
    });

    it('should default attachments to empty array', async () => {
      repo.findByDate.mockResolvedValue(null);
      repo.save.mockResolvedValue(makeEntry());

      await service.createEntry('user-1', 'some text');

      expect(repo.save).toHaveBeenCalledWith('user-1', expect.objectContaining({
        attachments: [],
      }));
    });

    it('should pass provided attachments through', async () => {
      const attachment: Attachment = {
        id: 'att-1',
        entryId: 'entry-1',
        type: 'photo',
        url: 'https://example.com/photo.jpg',
        createdAt: new Date(),
      };
      repo.findByDate.mockResolvedValue(null);
      repo.save.mockResolvedValue(makeEntry({ attachments: [attachment] }));

      await service.createEntry('user-1', 'some text', [attachment]);

      expect(repo.save).toHaveBeenCalledWith('user-1', expect.objectContaining({
        attachments: [attachment],
      }));
    });

    it('should allow multiple entries to be created for the same day', async () => {
      const entry1 = makeEntry({ id: 'entry-1', text: 'First entry' });
      const entry2 = makeEntry({ id: 'entry-2', text: 'Second entry' });
      repo.save
        .mockResolvedValueOnce(entry1)
        .mockResolvedValueOnce(entry2);

      const res1 = await service.createEntry('user-1', 'First entry');
      const res2 = await service.createEntry('user-1', 'Second entry');

      expect(res1.id).toBe('entry-1');
      expect(res2.id).toBe('entry-2');
      expect(repo.save).toHaveBeenCalledTimes(2);
    });

    it('should trigger vector indexing asynchronously', async () => {
      const saved = makeEntry();
      repo.findByDate.mockResolvedValue(null);
      repo.save.mockResolvedValue(saved);
      repo.update.mockResolvedValue({ ...saved, vectorIndexed: true });

      await service.createEntry('user-1', 'some text');

      // Allow microtasks to flush
      await new Promise((resolve) => setImmediate(resolve));

      expect(vectorSearch.indexEntry).toHaveBeenCalledWith('user-1', saved);
      expect(repo.update).toHaveBeenCalledWith('user-1', saved.id, { vectorIndexed: true });
    });

    it('should not fail if vector indexing errors', async () => {
      const saved = makeEntry();
      repo.findByDate.mockResolvedValue(null);
      repo.save.mockResolvedValue(saved);
      vectorSearch.indexEntry.mockRejectedValue(new Error('Index failure'));

      // createEntry itself should not throw even if indexing fails
      const result = await service.createEntry('user-1', 'some text');
      expect(result).toEqual(saved);

      // Allow microtasks to flush — no unhandled rejection
      await new Promise((resolve) => setImmediate(resolve));
    });
  });

  // --- autosave ---

  describe('autosave', () => {
    const ts = new Date('2026-09-02T10:05:00');

    it('should update entry with lastAutosaveAt timestamp', async () => {
      const existing = makeEntry();
      const updated = makeEntry({ text: 'Updated text', lastAutosaveAt: ts });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.autosave('user-1', 'entry-1', 'Updated text', ts);

      expect(result).toEqual(updated);
      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        text: 'Updated text',
        lastAutosaveAt: ts,
        vectorIndexed: false,
      });
    });

    it('should throw ConflictError if client timestamp is older than last autosave', async () => {
      const existing = makeEntry({ lastAutosaveAt: new Date('2026-09-02T10:10:00') }); // Newer
      repo.findById.mockResolvedValue(existing);

      await expect(service.autosave('user-1', 'entry-1', 'Old text', ts))
        .rejects.toThrow(ConflictError);
    });

    it('should proceed if client timestamp is newer than last autosave', async () => {
      const existing = makeEntry({ lastAutosaveAt: new Date('2026-09-02T10:00:00') }); // Older
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(existing);

      await service.autosave('user-1', 'entry-1', 'Newer text', ts);
      expect(repo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if entry does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.autosave('user-1', 'nope', 'text', ts))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if uid is empty', async () => {
      await expect(service.autosave('', 'entry-1', 'text', ts))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if entryId is empty', async () => {
      await expect(service.autosave('user-1', '', 'text', ts))
        .rejects.toThrow(ValidationError);
    });
  });

  // --- editEntry ---

  describe('editEntry', () => {
    it('should update entry text', async () => {
      const existing = makeEntry();
      const updated = makeEntry({ text: 'Updated text' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.editEntry('user-1', 'entry-1', 'Updated text');

      expect(result).toEqual(updated);
      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        text: 'Updated text',
        vectorIndexed: false,
      });
    });

    it('should throw when entry not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.editEntry('user-1', 'nope', 'text'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw when uid is empty', async () => {
      await expect(service.editEntry('', 'entry-1', 'text'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw when entryId is empty', async () => {
      await expect(service.editEntry('user-1', '', 'text'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw when text is empty', async () => {
      await expect(service.editEntry('user-1', 'entry-1', ''))
        .rejects.toThrow(ValidationError);
    });

    it('should trigger re-indexing asynchronously', async () => {
      const existing = makeEntry();
      const updated = makeEntry({ text: 'Updated' });
      repo.findById.mockResolvedValue(existing);
      repo.update
        .mockResolvedValueOnce(updated)                            // main update
        .mockResolvedValueOnce({ ...updated, vectorIndexed: true }); // index flag

      await service.editEntry('user-1', 'entry-1', 'Updated');

      await new Promise((resolve) => setImmediate(resolve));

      expect(vectorSearch.indexEntry).toHaveBeenCalledWith('user-1', updated);
    });
  });

  // --- getTimeline ---

  describe('getTimeline', () => {
    it('should return entries with AI summaries, sorted newest-first', async () => {
      const longText1 = 'Day one was wonderful and peaceful as I walked outside and took time to reflect on everything that happened during the busy week.';
      const longText2 = 'Day two was equally refreshing with lots of productive tasks completed and relaxing quiet time spent reading books and drinking hot tea.';
      const older = makeEntry({ id: 'e-1', date: new Date('2026-09-01'), text: longText1 });
      const newer = makeEntry({ id: 'e-2', date: new Date('2026-09-02'), text: longText2 });
      repo.listByUser.mockResolvedValue([older, newer]);
      aiProvider.summarize
        .mockResolvedValueOnce('Summary of Day 1')
        .mockResolvedValueOnce('Summary of Day 2');

      const result = await service.getTimeline('user-1');

      expect(result).toEqual([
        { id: 'e-2', date: new Date('2026-09-02'), preview: 'Summary of Day 2', snippet: longText2, wordCount: 22, hasAttachments: false },
        { id: 'e-1', date: new Date('2026-09-01'), preview: 'Summary of Day 1', snippet: longText1, wordCount: 23, hasAttachments: false },
      ]);
    });

    it('should throw when uid is empty', async () => {
      await expect(service.getTimeline(''))
        .rejects.toThrow(ValidationError);
    });

    it('should return empty array when no entries exist', async () => {
      repo.listByUser.mockResolvedValue([]);

      const result = await service.getTimeline('user-1');

      expect(result).toEqual([]);
      expect(aiProvider.summarize).not.toHaveBeenCalled();
    });

    it('should use cached summary when present without calling aiProvider.summarize', async () => {
      const entry = makeEntry({ id: 'e-1', date: new Date('2026-09-01'), text: 'Day 1 text', summary: 'Cached summary' });
      repo.listByUser.mockResolvedValue([entry]);

      const result = await service.getTimeline('user-1');

      expect(result[0].preview).toBe('Cached summary');
      expect(aiProvider.summarize).not.toHaveBeenCalled();
    });

    it('should skip summarization if entry has 20 or fewer words', async () => {
      const shortText = 'Only a few words written here.';
      const entry = makeEntry({ id: 'e-1', date: new Date('2026-09-01'), text: shortText });
      repo.listByUser.mockResolvedValue([entry]);

      const result = await service.getTimeline('user-1');

      expect(result[0].preview).toBeUndefined();
      expect(aiProvider.summarize).not.toHaveBeenCalled();
    });
  });

  // --- generateAndSaveSummary ---

  describe('generateAndSaveSummary', () => {
    it('should generate and save a summary for a valid entry with >20 words', async () => {
      const longText = 'Today was a wonderful morning where I walked through the park, watched the sunrise, and reflected deeply on my personal growth and ongoing creative aspirations.';
      const entry = makeEntry({ text: longText });
      repo.findById.mockResolvedValue(entry);
      aiProvider.generateSummary.mockResolvedValue('A generated summary');

      await service.generateAndSaveSummary('user-1', 'entry-1');

      expect(aiProvider.generateSummary).toHaveBeenCalledWith(longText);
      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', { summary: 'A generated summary' });
    });

    it('should not generate a summary if the entry text has 20 or fewer words', async () => {
      const entry = makeEntry({ text: 'short text here' });
      repo.findById.mockResolvedValue(entry);

      await service.generateAndSaveSummary('user-1', 'entry-1');

      expect(aiProvider.generateSummary).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the entry does not exist or belongs to another user', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.generateAndSaveSummary('user-1', 'entry-1')).rejects.toThrow(NotFoundError);
    });
  });

  // --- addAttachment / removeAttachment ---

  describe('attachments', () => {
    it('should successfully add a valid Voice attachment to an existing entry', async () => {
      const entry = makeEntry();
      repo.findById.mockResolvedValue(entry);
      
      const newAttachment = await service.addAttachment('user-1', 'entry-1', {
        type: 'voice',
        url: 'http://example.com/voice.m4a',
        duration: 120
      } as any);

      expect(newAttachment.id).toBeDefined();
      expect(newAttachment.type).toBe('voice');
      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        attachments: [newAttachment]
      });
    });

    it('should successfully add a valid Location attachment to an existing entry', async () => {
      const entry = makeEntry();
      repo.findById.mockResolvedValue(entry);
      
      const newAttachment = await service.addAttachment('user-1', 'entry-1', {
        type: 'location',
        lat: 10,
        lng: 20,
        locationLabel: 'Home'
      } as any);

      expect(newAttachment.id).toBeDefined();
      expect(newAttachment.type).toBe('location');
      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        attachments: [newAttachment]
      });
    });

    it('should throw an error when attempting to add an attachment to an unauthorized or non-existent entry', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.addAttachment('user-1', 'entry-1', { type: 'voice', url: 'x' } as any))
        .rejects.toThrow(NotFoundError);
    });

    it('should successfully remove an attachment by its ID', async () => {
      const entry = makeEntry({
        attachments: [
          { id: 'att-1', entryId: 'entry-1', type: 'voice', url: 'x', createdAt: new Date() } as any,
          { id: 'att-2', entryId: 'entry-1', type: 'photo', url: 'y', createdAt: new Date() } as any,
        ]
      });
      repo.findById.mockResolvedValue(entry);

      await service.removeAttachment('user-1', 'entry-1', 'att-1');

      expect(repo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        attachments: expect.arrayContaining([
          expect.objectContaining({ id: 'att-2' })
        ])
      });
      // Ensure att-1 is not in the array
      const updateCall = repo.update.mock.calls[0][2];
      expect(updateCall.attachments).toHaveLength(1);
      expect(updateCall.attachments![0].id).toBe('att-2');
    });
  });

  describe('getEntry', () => {
    it('should retrieve full entry by id for owner', async () => {
      const entry = makeEntry({ id: 'entry-1', uid: 'user-1' });
      repo.findById.mockResolvedValue(entry);

      const result = await service.getEntry('user-1', 'entry-1');
      expect(result).toBe(entry);
      expect(repo.findById).toHaveBeenCalledWith('user-1', 'entry-1');
    });

    it('should throw NotFoundError if entry does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getEntry('user-1', 'entry-non-existent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if entry belongs to another user', async () => {
      const entry = makeEntry({ id: 'entry-1', uid: 'other-user' });
      repo.findById.mockResolvedValue(entry);

      await expect(service.getEntry('user-1', 'entry-1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if uid or entryId is empty', async () => {
      await expect(service.getEntry('', 'entry-1')).rejects.toThrow(ValidationError);
      await expect(service.getEntry('user-1', '')).rejects.toThrow(ValidationError);
    });
  });
});
