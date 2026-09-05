import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from '../entries.controller';
import { EntryService } from '../../../services/entry.service';
import { CreateEntryDto } from '../../dto/create-entry.dto';

describe('EntriesController', () => {
  let controller: EntriesController;
  let service: jest.Mocked<EntryService>;

  beforeEach(async () => {
    const mockEntryService = {
      createEntry: jest.fn(),
      getTimeline: jest.fn(),
      editEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntryService,
          useValue: mockEntryService,
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
    service = module.get(EntryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEntry', () => {
    it('should call entry service with uid and dto', async () => {
      const mockReq = { user: { uid: 'user123' } };
      const dto: CreateEntryDto = { text: 'test' };
      const expectedResult = { id: 'entry1', text: 'test' } as any;
      service.createEntry.mockResolvedValue(expectedResult);

      const result = await controller.createEntry(mockReq, dto);

      expect(service.createEntry).toHaveBeenCalledWith('user123', 'test', undefined);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline from service', async () => {
      const mockReq = { user: { uid: 'user123' } };
      const expectedResult = [{ id: '1' }] as any;
      service.getTimeline.mockResolvedValue(expectedResult);

      const result = await controller.getTimeline(mockReq);

      expect(service.getTimeline).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ data: expectedResult, meta: { total: expectedResult.length } });
    });
  });

  describe('autosaveEntry', () => {
    it('should call autosave on service', async () => {
      const mockReq = { user: { uid: 'user123' } };
      service.autosave = jest.fn().mockResolvedValue({ id: 'e1' });
      const ts = new Date().toISOString();
      const res = await controller.autosaveEntry(mockReq, 'e1', 'new text', ts);
      expect(service.autosave).toHaveBeenCalledWith('user123', 'e1', 'new text', new Date(ts));
      expect(res).toEqual({ id: 'e1' });
    });
  });
});
