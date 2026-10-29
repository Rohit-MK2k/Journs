import { SemanticSearchService } from '@journ/entries/services/semantic-search.service';
import { VectorSearchProvider } from '@journ/entries/interfaces';
import { AIProvider, ValidationError } from '@journ/common';
import { Entry, VectorSearchResult } from '@journ/entries/domain';

function makeEntry(id: string): Entry {
  return {
    id,
    uid: 'user-1',
    date: new Date(),
    text: `Text for ${id}`,
    attachments: [],
    vectorIndexed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let vectorSearch: jest.Mocked<VectorSearchProvider>;
  let aiProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    vectorSearch = {
      indexEntry: jest.fn(),
      removeEntry: jest.fn(),
      removeAll: jest.fn(),
      semanticSearch: jest.fn(),
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

    service = new SemanticSearchService(vectorSearch, aiProvider);
  });

  /**
   * @testType Unit Test
   * @target SemanticSearchService.search
   * @description Verifies that vector distances are mapped to scores and semantic chips are extracted.
   */
  it('should map distances to percentages and extract semantic chips', async () => {
    const vr1: VectorSearchResult = { entry: makeEntry('e1'), distance: 0.1 };
    const vr2: VectorSearchResult = { entry: makeEntry('e2'), distance: 1.5 };
    
    vectorSearch.semanticSearch.mockResolvedValue([vr1, vr2]);
    aiProvider.extractSemanticChips
      .mockResolvedValueOnce(['chip A', 'chip B'])
      .mockResolvedValueOnce(['chip C']);

    const results = await service.search('user-1', 'search query');

    expect(vectorSearch.semanticSearch).toHaveBeenCalledWith('user-1', 'search query');
    expect(aiProvider.extractSemanticChips).toHaveBeenCalledTimes(2);
    
    expect(results).toHaveLength(2);
    expect(results[0].entry.id).toBe('e1');
    expect(results[0].matchScore).toBe(95);
    expect(results[0].semanticChips).toEqual(['chip A', 'chip B']);

    expect(results[1].entry.id).toBe('e2');
    expect(results[1].matchScore).toBe(25);
    expect(results[1].semanticChips).toEqual(['chip C']);
  });

  /**
   * @testType Unit Test
   * @target SemanticSearchService.search
   * @description Verifies that an empty array is returned when vector search produces zero results.
   */
  it('should return empty array if no vector results', async () => {
    vectorSearch.semanticSearch.mockResolvedValue([]);
    const results = await service.search('user-1', 'query');
    expect(results).toEqual([]);
    expect(aiProvider.extractSemanticChips).not.toHaveBeenCalled();
  });

  /**
   * @testType Unit Test
   * @target SemanticSearchService.search
   * @description Verifies that ValidationError is thrown when uid is empty.
   */
  it('should throw validation error if uid is empty', async () => {
    await expect(service.search('', 'query')).rejects.toThrow(ValidationError);
  });

  /**
   * @testType Unit Test
   * @target SemanticSearchService.search
   * @description Verifies that ValidationError is thrown when query is whitespace only.
   */
  it('should throw validation error if query is empty', async () => {
    await expect(service.search('user-1', '   ')).rejects.toThrow(ValidationError);
  });
});
