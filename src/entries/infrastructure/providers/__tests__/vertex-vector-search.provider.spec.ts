import { VertexAIVectorSearchProvider } from '../vertex-vector-search.provider';

const mockGenAiClient = {
  models: { embedContent: jest.fn().mockResolvedValue({ embeddings: [{ values: [0.1, 0.2, 0.3] }] }) }
} as any;

const mockUpsert = jest.fn().mockResolvedValue([]);
const mockRemove = jest.fn().mockResolvedValue([]);
const mockFind = jest.fn().mockResolvedValue([{
  nearestNeighbors: [{ neighbors: [{ datapoint: { datapointId: 'entry-123' } }] }]
}]);

const mockIndexClient = {
  indexPath: jest.fn().mockReturnValue('index-path'),
  upsertDatapoints: mockUpsert,
  removeDatapoints: mockRemove,
} as any;

const mockMatchClient = {
  indexEndpointPath: jest.fn().mockReturnValue('endpoint-path'),
  findNeighbors: mockFind,
} as any;

describe('VertexAIVectorSearchProvider', () => {
  let provider: VertexAIVectorSearchProvider;

  beforeEach(() => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.VERTEX_INDEX_ID = 'index-123';
    process.env.VERTEX_INDEX_ENDPOINT_ID = 'endpoint-123';
    process.env.VERTEX_PUBLIC_DOMAIN = 'domain.com';

    provider = new VertexAIVectorSearchProvider(mockGenAiClient, mockIndexClient, mockMatchClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should index entry successfully using gemini-embedding-2', async () => {
    await expect(
      provider.indexEntry('user-1', { id: 'entry-1', text: 'test' } as any)
    ).resolves.toBeUndefined();
    expect(mockGenAiClient.models.embedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-2',
      contents: 'test',
    });
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('should skip indexEntry upsert if embedding generation fails', async () => {
    mockGenAiClient.models.embedContent.mockRejectedValueOnce(new Error('Embedding API failure'));
    await expect(
      provider.indexEntry('user-1', { id: 'entry-1', text: 'test' } as any)
    ).resolves.toBeUndefined();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('should remove entry successfully', async () => {
    await expect(
      provider.removeEntry('user-1', 'entry-1')
    ).resolves.toBeUndefined();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('should return matching entry ids on semantic search', async () => {
    const results = await provider.semanticSearch('user-1', 'query');
    expect(mockGenAiClient.models.embedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-2',
      contents: 'query',
    });
    expect(results).toHaveLength(1);
    expect(results[0].entry.id).toBe('entry-123');
    expect(mockFind).toHaveBeenCalled();
  });

  it('should handle embedding failure gracefully in semantic search', async () => {
    mockGenAiClient.models.embedContent.mockRejectedValueOnce(new Error('Embedding API failure'));
    const results = await provider.semanticSearch('user-1', 'query');
    expect(results).toEqual([]);
    expect(mockFind).not.toHaveBeenCalled();
  });
});
