import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '@journ/chat/presentation/controllers/chat.controller';
import { ChatService } from '@journ/chat/services/chat.service';
import { SendMessageDto } from '@journ/chat/presentation/dto/send-message.dto';
import { ConfirmDraftDto } from '@journ/chat/presentation/dto/confirm-draft.dto';

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
    /**
     * @testType Unit Test
     * @target ChatController.startSession
     * @description Verifies that startSession calls chatService.startSession with authenticated user uid.
     */
    it('should call startSession', async () => {
      service.startSession.mockResolvedValue({} as any);
      await controller.startSession({ user: { uid: 'u1' } });
      expect(service.startSession).toHaveBeenCalledWith('u1');
    });
  });

  describe('sendMessage', () => {
    /**
     * @testType Unit Test
     * @target ChatController.sendMessage
     * @description Verifies that sendMessage invokes chatService.sendMessage and writes response chunks to HTTP response.
     */
    it('should call sendMessage', async () => {
      service.sendMessage.mockResolvedValue({} as any);
      const dto: SendMessageDto = { message: 'hello', mode: 'text' };
      const mockRes = { setHeader: jest.fn(), write: jest.fn(), end: jest.fn() };
      await controller.sendMessage({ user: { uid: 'u1' } }, dto, mockRes);
      expect(mockRes.write).toHaveBeenCalled();
      expect(service.sendMessage).toHaveBeenCalledWith('u1', 'hello', 'text');
    });
  });

  describe('confirmDraft', () => {
    /**
     * @testType Unit Test
     * @target ChatController.confirmDraft
     * @description Verifies that confirmDraft calls chatService.confirmDraftSave with user uid, draft, and target.
     */
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
