import { FirestoreCosineVectorSearchProvider } from '../firestore-cosine-vector-search.provider';

describe('FirestoreCosineVectorSearchProvider', () => {
  let provider: FirestoreCosineVectorSearchProvider;
  let mockGenAiClient: any;
  let mockEntryRepo: any;

  beforeEach(() => {
    mockGenAiClient = {
      models: {
        embedContent: jest.fn().mockResolvedValue({
          embeddings: [{ values: [1, 0, 0] }],
        }),
      },
    };

    mockEntryRepo = {
      update: jest.fn().mockResolvedValue({}),
      listByUser: jest.fn().mockResolvedValue([]),
    };

    provider = new FirestoreCosineVectorSearchProvider(mockGenAiClient, mockEntryRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('indexEntry', () => {
    it('should generate 768-dim embedding and store it in Firestore', async () => {
      const entry = {
        id: 'entry-1',
        uid: 'user-1',
        text: 'Morning workout reflection',
      } as any;

      await provider.indexEntry('user-1', entry);

      expect(mockGenAiClient.models.embedContent).toHaveBeenCalledWith({
        model: 'gemini-embedding-2',
        contents: 'Morning workout reflection',
        config: { outputDimensionality: 768 },
      });

      expect(mockEntryRepo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        embedding: [1, 0, 0],
        vectorIndexed: true,
      });
    });

    it('should skip indexing when entry text is empty', async () => {
      const entry = {
        id: 'entry-1',
        uid: 'user-1',
        text: '   ',
      } as any;

      await provider.indexEntry('user-1', entry);

      expect(mockGenAiClient.models.embedContent).not.toHaveBeenCalled();
      expect(mockEntryRepo.update).not.toHaveBeenCalled();
    });

    it('should skip updating when embedding response is empty', async () => {
      mockGenAiClient.models.embedContent.mockResolvedValueOnce({ embeddings: [] });

      const entry = {
        id: 'entry-1',
        uid: 'user-1',
        text: 'Some valid text',
      } as any;

      await provider.indexEntry('user-1', entry);

      expect(mockEntryRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('removeEntry', () => {
    it('should clear embedding and vectorIndexed flag on the entry', async () => {
      await provider.removeEntry('user-1', 'entry-1');

      expect(mockEntryRepo.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        embedding: undefined,
        vectorIndexed: false,
      });
    });
  });

  describe('removeAll', () => {
    it('should resolve successfully', async () => {
      await expect(provider.removeAll('user-1')).resolves.toBeUndefined();
    });
  });

  describe('semanticSearch', () => {
    it('should calculate exact cosine similarity and rank highest matches first', async () => {
      // Query vector: [1, 0]
      mockGenAiClient.models.embedContent.mockResolvedValueOnce({
        embeddings: [{ values: [1, 0] }],
      });

      // Three candidate entries:
      // entry-1: identical direction [2, 0] -> similarity 1.0, distance 0
      // entry-2: 45 degree angle [1, 1] -> similarity 0.7071, distance ~0.293
      // entry-3: orthogonal [0, 5] -> similarity 0.0, distance 1.0
      mockEntryRepo.listByUser.mockResolvedValueOnce([
        { id: 'entry-3', text: 'Orthogonal', embedding: [0, 5] },
        { id: 'entry-1', text: 'Identical direction', embedding: [2, 0] },
        { id: 'entry-2', text: 'Partial match', embedding: [1, 1] },
        { id: 'entry-4', text: 'No embedding', embedding: undefined },
      ]);

      const results = await provider.semanticSearch('user-1', 'query');

      expect(results).toHaveLength(3);
      expect(results[0].entry.id).toBe('entry-1');
      expect(results[0].distance).toBeCloseTo(0, 4);

      expect(results[1].entry.id).toBe('entry-2');
      expect(results[1].distance).toBeCloseTo(0.2929, 3);

      expect(results[2].entry.id).toBe('entry-3');
      expect(results[2].distance).toBeCloseTo(1, 4);
    });

    it('should return empty array if query embedding fails', async () => {
      mockGenAiClient.models.embedContent.mockRejectedValueOnce(new Error('API error'));

      const results = await provider.semanticSearch('user-1', 'query');
      expect(results).toEqual([]);
    });

    it('should return empty array if user has no entries with embeddings', async () => {
      mockGenAiClient.models.embedContent.mockResolvedValueOnce({
        embeddings: [{ values: [1, 0] }],
      });
      mockEntryRepo.listByUser.mockResolvedValueOnce([
        { id: 'entry-1', text: 'No embedding' },
      ]);

      const results = await provider.semanticSearch('user-1', 'query');
      expect(results).toEqual([]);
    });
  });
});
