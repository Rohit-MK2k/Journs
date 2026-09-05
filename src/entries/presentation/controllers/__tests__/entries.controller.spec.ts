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

  describe('generateSummary', () => {
    it('should call generateAndSaveSummary', async () => {
      service.generateAndSaveSummary = jest.fn().mockResolvedValue(undefined);
      const res = await controller.generateSummary({ user: { uid: 'u1' } }, 'e1');
      expect(service.generateAndSaveSummary).toHaveBeenCalledWith('u1', 'e1');
      expect(res.success).toBe(true);
    });
  });

  describe('attachments', () => {
    it('should generate upload url', async () => {
      const mockStorage = { generateUploadUrl: jest.fn().mockResolvedValue({ uploadUrl: 'http://url' }) };
      const res = await controller.generateUploadUrl({ user: { uid: 'u1' } }, 'image/png', 'png', mockStorage as any);
      expect(mockStorage.generateUploadUrl).toHaveBeenCalledWith('u1', 'image/png', 'png');
      expect(res.uploadUrl).toBe('http://url');
    });

    it('should add attachment', async () => {
      service.addAttachment = jest.fn().mockResolvedValue({ id: 'a1' });
      const dto = { type: 'photo' as const };
      const res = await controller.addAttachment({ user: { uid: 'u1' } }, 'e1', dto);
      expect(service.addAttachment).toHaveBeenCalledWith('u1', 'e1', dto);
      expect(res).toEqual({ id: 'a1' });
    });

    it('should remove attachment', async () => {
      service.removeAttachment = jest.fn().mockResolvedValue(undefined);
      const res = await controller.removeAttachment({ user: { uid: 'u1' } }, 'e1', 'a1');
      expect(service.removeAttachment).toHaveBeenCalledWith('u1', 'e1', 'a1');
      expect(res.success).toBe(true);
    });
  });
});
