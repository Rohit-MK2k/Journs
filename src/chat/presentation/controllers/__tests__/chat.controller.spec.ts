import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../chat.controller';
import { ChatService } from '../../../services/chat.service';
import { SendMessageDto } from '../../dto/send-message.dto';
import { ConfirmDraftDto } from '../../dto/confirm-draft.dto';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('ChatController', () => {
  let controller: ChatController;
  let service: jest.Mocked<ChatService>;

  beforeEach(async () => {
    const mockChatService = {
      startSession: jest.fn(),
      sendMessage: jest.fn(),
      confirmDraftSave: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get(ChatService);
  });

  describe('startSession', () => {
    it('should call startSession', async () => {
      service.startSession.mockResolvedValue({} as any);
      await controller.startSession({ user: { uid: 'u1' } });
      expect(service.startSession).toHaveBeenCalledWith('u1');
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessage', async () => {
      service.sendMessage.mockResolvedValue({} as any);
      const dto: SendMessageDto = { message: 'hello', mode: 'text' };
      await controller.sendMessage({ user: { uid: 'u1' } }, dto);
      expect(service.sendMessage).toHaveBeenCalledWith('u1', 'hello', 'text');
    });
  });

  describe('confirmDraft', () => {
    it('should call confirmDraftSave', async () => {
      service.confirmDraftSave.mockResolvedValue({} as any);
      const dto = new ConfirmDraftDto();
      dto.draft = { text: 't', sourceContext: 'ctx' };
      dto.target = 'new';
      await controller.confirmDraft({ user: { uid: 'u1' } }, dto);
      expect(service.confirmDraftSave).toHaveBeenCalledWith('u1', dto.draft, 'new');
    });
  });
});
