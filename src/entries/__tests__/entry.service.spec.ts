import { EntryService } from '../services/entry.service';
import { Entry, Attachment } from '../domain';
import { EntryRepository } from '../interfaces/entry-repository.interface';
import { VectorSearchProvider } from '../interfaces/vector-search-provider.interface';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';

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
    };

    aiProvider = {
      summarize: jest.fn(),
      chat: jest.fn(),
      extractContext: jest.fn(),
      deriveHabitMemory: jest.fn(),
    };

    vectorSearch = {
      indexEntry: jest.fn().mockResolvedValue(undefined),
      removeEntry: jest.fn().mockResolvedValue(undefined),
      semanticSearch: jest.fn(),
    };

    service = new EntryService(repo, aiProvider, vectorSearch);
  });

  // --- createEntry ---

  describe('createEntry', () => {
    it('should create an entry with valid inputs', async () => {
      const saved = makeEntry();
      repo.findByDate.mockResolvedValue(null);
      repo.save.mockResolvedValue(saved);
      repo.update.mockResolvedValue({ ...saved, vectorIndexed: true });

      const result = await service.createEntry('user-1', 'Today was productive.');

      expect(result).toEqual(saved);
      expect(repo.findByDate).toHaveBeenCalledWith('user-1', expect.any(Date));
      expect(repo.save).toHaveBeenCalledWith('user-1', expect.objectContaining({
        uid: 'user-1',
        text: 'Today was productive.',
        attachments: [],
        vectorIndexed: false,
      }));
    });

    it('should throw when uid is empty', async () => {
      await expect(service.createEntry('', 'some text'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when uid is whitespace only', async () => {
      await expect(service.createEntry('   ', 'some text'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when text is empty', async () => {
      await expect(service.createEntry('user-1', ''))
        .rejects.toThrow('Entry text must not be empty');
    });

    it('should throw when text is whitespace only', async () => {
      await expect(service.createEntry('user-1', '   '))
        .rejects.toThrow('Entry text must not be empty');
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

    it('should throw when an entry for today already exists', async () => {
      repo.findByDate.mockResolvedValue(makeEntry());

      await expect(service.createEntry('user-1', 'new text'))
        .rejects.toThrow('An entry for today already exists');
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
        .rejects.toThrow('Entry not found: nope');
    });

    it('should throw when uid is empty', async () => {
      await expect(service.editEntry('', 'entry-1', 'text'))
        .rejects.toThrow('uid must not be empty');
    });

    it('should throw when entryId is empty', async () => {
      await expect(service.editEntry('user-1', '', 'text'))
        .rejects.toThrow('entryId must not be empty');
    });

    it('should throw when text is empty', async () => {
      await expect(service.editEntry('user-1', 'entry-1', ''))
        .rejects.toThrow('Entry text must not be empty');
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
      const older = makeEntry({ id: 'e-1', date: new Date('2026-09-01'), text: 'Day 1' });
      const newer = makeEntry({ id: 'e-2', date: new Date('2026-09-02'), text: 'Day 2' });
      repo.listByUser.mockResolvedValue([older, newer]);
      aiProvider.summarize
        .mockResolvedValueOnce('Summary of Day 1')
        .mockResolvedValueOnce('Summary of Day 2');

      const result = await service.getTimeline('user-1');

      expect(result).toEqual([
        { id: 'e-2', date: new Date('2026-09-02'), preview: 'Summary of Day 2' },
        { id: 'e-1', date: new Date('2026-09-01'), preview: 'Summary of Day 1' },
      ]);
    });

    it('should throw when uid is empty', async () => {
      await expect(service.getTimeline(''))
        .rejects.toThrow('uid must not be empty');
    });

    it('should return empty array when no entries exist', async () => {
      repo.listByUser.mockResolvedValue([]);

      const result = await service.getTimeline('user-1');

      expect(result).toEqual([]);
      expect(aiProvider.summarize).not.toHaveBeenCalled();
    });
  });
});
