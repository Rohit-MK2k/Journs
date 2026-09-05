import { SearchController } from '../search.controller';

describe('SearchController', () => {
  let controller: SearchController;
  let service: any;

  beforeEach(() => {
    service = {
      search: jest.fn().mockResolvedValue([{ id: '1' }]),
    };
    controller = new SearchController(service);
  });

  it('should return matches', async () => {
    const res = await controller.semanticSearch({ user: { uid: 'u1' } }, 'test query');
    expect(res.matches).toEqual([{ id: '1' }]);
    expect(service.search).toHaveBeenCalledWith('u1', 'test query');
  });

  it('should return empty matches if no query', async () => {
    const res = await controller.semanticSearch({ user: { uid: 'u1' } }, '');
    expect(res.matches).toEqual([]);
    expect(service.search).not.toHaveBeenCalled();
  });
});
