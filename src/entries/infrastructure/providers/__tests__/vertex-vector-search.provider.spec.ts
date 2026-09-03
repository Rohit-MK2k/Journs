import { VertexAIVectorSearchProvider } from '../vertex-vector-search.provider';

describe('VertexAIVectorSearchProvider', () => {
  let provider: VertexAIVectorSearchProvider;

  beforeEach(() => {
    provider = new VertexAIVectorSearchProvider();
  });

  it('should index entry without error', async () => {
    await expect(provider.indexEntry('uid', {} as any)).resolves.toBeUndefined();
  });

  it('should return empty array on search', async () => {
    const results = await provider.semanticSearch('uid', 'query');
    expect(results).toEqual([]);
  });
});
