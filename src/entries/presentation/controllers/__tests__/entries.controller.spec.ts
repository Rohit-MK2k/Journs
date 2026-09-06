import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from '../entries.controller';
import { EntryService } from '../../../services/entry.service';
import { CreateEntryDto } from '../../dto/create-entry.dto';

describe('EntriesController', () => {
  let controller: EntriesController;
  let service: jest.Mocked<EntryService>;
  let mockStorageProvider: { generateUploadUrl: jest.Mock; deleteFile: jest.Mock; getSignedReadUrl: jest.Mock };
  let mockPendingRepo: { create: jest.Mock; delete: jest.Mock; deleteMany: jest.Mock; deleteByUrlsOrPaths: jest.Mock; findOrphansBefore: jest.Mock; findById: jest.Mock };

  beforeEach(async () => {
    const mockEntryService = {
      createEntry: jest.fn(),
      getTimeline: jest.fn(),
      editEntry: jest.fn(),
      getEntry: jest.fn(),
    };

    mockStorageProvider = {
      generateUploadUrl: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getSignedReadUrl: jest.fn().mockResolvedValue('https://signed.url/image.jpg'),
    };

    mockPendingRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue(undefined),
      deleteByUrlsOrPaths: jest.fn().mockResolvedValue(undefined),
      findOrphansBefore: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntryService,
          useValue: mockEntryService,
        },
        {
          provide: 'StorageProvider',
          useValue: mockStorageProvider,
        },
        {
          provide: 'PendingAttachmentRepository',
          useValue: mockPendingRepo,
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
      const expectedEntries = [{ id: '1', text: 'test', date: new Date() }] as any[];
      service.getTimeline = jest.fn().mockResolvedValue(expectedEntries);

      const result = await controller.getTimeline(mockReq);

      expect(service.getTimeline).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ data: expectedEntries, meta: { total: 1 } });
    });
  });

  describe('autosave', () => {
    it('should autosave entry via service', async () => {
      service.autosave = jest.fn().mockResolvedValue({ id: 'e1' } as any);
      const res = await controller.autosaveEntry(
        { user: { uid: 'u1' } },
        'e1',
        'draft text',
        '2026-09-02T12:00:00.000Z'
      );
      expect(service.autosave).toHaveBeenCalledWith('u1', 'e1', 'draft text', new Date('2026-09-02T12:00:00.000Z'));
      expect(res).toEqual({ id: 'e1' });
    });
  });

  describe('summary', () => {
    it('should trigger summary generation', async () => {
      service.generateAndSaveSummary = jest.fn().mockResolvedValue(undefined);
      const res = await controller.generateSummary({ user: { uid: 'u1' } }, 'e1');
      expect(service.generateAndSaveSummary).toHaveBeenCalledWith('u1', 'e1');
      expect(res.success).toBe(true);
    });
  });

  describe('attachments', () => {
    it('should generate upload url and record pending attachment', async () => {
      mockStorageProvider.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'http://url',
        publicUrl: 'http://public',
        filePath: 'users/u1/attachments/file.png',
        fileId: 'f1',
      });
      const res = await controller.generateUploadUrl({ user: { uid: 'u1' } }, 'image/png', 'png');
      expect(mockStorageProvider.generateUploadUrl).toHaveBeenCalledWith('u1', 'image/png', 'png');
      expect(mockPendingRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        id: 'f1',
        uid: 'u1',
        filePath: 'users/u1/attachments/file.png',
        publicUrl: 'http://public',
      }));
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

    it('should delete pending attachment and clean storage', async () => {
      mockPendingRepo.findById.mockResolvedValue({
        id: 'f1',
        uid: 'u1',
        filePath: 'users/u1/attachments/test.jpg',
      });
      const res = await controller.deletePendingAttachment({ user: { uid: 'u1' } }, 'f1');
      expect(mockPendingRepo.findById).toHaveBeenCalledWith('f1');
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('users/u1/attachments/test.jpg');
      expect(mockPendingRepo.delete).toHaveBeenCalledWith('f1');
      expect(res.success).toBe(true);
    });
  });

  describe('getEntry', () => {
    it('should return full entry from service', async () => {
      const mockReq = { user: { uid: 'user123' } };
      const expectedEntry = { id: 'entry1', text: 'full text', attachments: [] } as any;
      service.getEntry = jest.fn().mockResolvedValue(expectedEntry);

      const result = await controller.getEntry(mockReq, 'entry1');

      expect(service.getEntry).toHaveBeenCalledWith('user123', 'entry1');
      expect(result).toEqual(expectedEntry);
    });

    it('should sign attachment URLs when returning an entry with media attachments', async () => {
      const mockReq = { user: { uid: 'user123' } };
      const expectedEntry = {
        id: 'entry1',
        text: 'full text',
        attachments: [
          { type: 'photo', filePath: 'users/user123/attachments/pic.jpg', url: 'https://storage.googleapis.com/pic.jpg' },
        ],
      } as any;
      service.getEntry = jest.fn().mockResolvedValue(expectedEntry);

      const result = await controller.getEntry(mockReq, 'entry1');

      expect(mockStorageProvider.getSignedReadUrl).toHaveBeenCalledWith('users/user123/attachments/pic.jpg');
      expect((result.attachments[0] as any).url).toBe('https://signed.url/image.jpg');
      expect((result.attachments[0] as any).previewUrl).toBe('https://signed.url/image.jpg');
    });
  });
});
