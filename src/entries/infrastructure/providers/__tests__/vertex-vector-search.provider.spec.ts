import { VertexAIVectorSearchProvider } from '../vertex-vector-search.provider';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      embedContent: jest.fn().mockResolvedValue({ embeddings: [{ values: [0.1, 0.2, 0.3] }] }),
    },
  })),
}));

const mockUpsert = jest.fn().mockResolvedValue([]);
const mockRemove = jest.fn().mockResolvedValue([]);
const mockFind = jest.fn().mockResolvedValue([{
  nearestNeighbors: [{ neighbors: [{ datapoint: { datapointId: 'entry-123' } }] }]
}]);

jest.mock('@google-cloud/aiplatform', () => ({
  v1: {
    IndexServiceClient: jest.fn().mockImplementation(() => ({
      indexPath: jest.fn().mockReturnValue('index-path'),
      upsertDatapoints: mockUpsert,
      removeDatapoints: mockRemove,
    })),
    MatchServiceClient: jest.fn().mockImplementation(() => ({
      indexEndpointPath: jest.fn().mockReturnValue('endpoint-path'),
      findNeighbors: mockFind,
    })),
  },
}));

describe('VertexAIVectorSearchProvider', () => {
  let provider: VertexAIVectorSearchProvider;

  beforeEach(() => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.VERTEX_INDEX_ID = 'index-123';
    process.env.VERTEX_INDEX_ENDPOINT_ID = 'endpoint-123';
    process.env.VERTEX_PUBLIC_DOMAIN = 'domain.com';

    provider = new VertexAIVectorSearchProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should index entry successfully', async () => {
    await expect(
      provider.indexEntry('user-1', { id: 'entry-1', text: 'test' } as any)
    ).resolves.toBeUndefined();
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('should remove entry successfully', async () => {
    await expect(
      provider.removeEntry('user-1', 'entry-1')
    ).resolves.toBeUndefined();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('should return matching entry ids on semantic search', async () => {
    const results = await provider.semanticSearch('user-1', 'query');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('entry-123');
    expect(mockFind).toHaveBeenCalled();
  });
});
