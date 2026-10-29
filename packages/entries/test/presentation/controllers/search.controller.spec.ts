import { SearchController } from '@journ/entries/presentation/controllers/search.controller';

describe('SearchController', () => {
  let controller: SearchController;
  let service: any;

  beforeEach(() => {
    service = {
      search: jest.fn().mockResolvedValue([{ id: '1' }]),
    };
    controller = new SearchController(service);
  });

  /**
   * @testType Unit Test
   * @target SearchController.semanticSearch
   * @description Verifies that semantic search calls the search service with authenticated uid and query.
   */
  it('should return matches', async () => {
    const res = await controller.semanticSearch({ user: { uid: 'u1' } }, 'test query');
    expect(res.matches).toEqual([{ id: '1' }]);
    expect(service.search).toHaveBeenCalledWith('u1', 'test query');
  });

  /**
   * @testType Unit Test
   * @target SearchController.semanticSearch
   * @description Verifies that an empty query returns empty matches without calling the search service.
   */
  it('should return empty matches if no query', async () => {
    const res = await controller.semanticSearch({ user: { uid: 'u1' } }, '');
    expect(res.matches).toEqual([]);
    expect(service.search).not.toHaveBeenCalled();
  });
});
