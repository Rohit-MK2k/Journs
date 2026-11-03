import { Test } from '@nestjs/testing';
import { CommonModule } from '@journ/common';
import { ChatModule } from '@journ/chat/chat.module';
import { ChatController } from '@journ/chat/presentation/controllers/chat.controller';
import { ChatService } from '@journ/chat/services/chat.service';

describe('ChatModule', () => {
  /**
   * @testType Integration Test
   * @target ChatModule
   * @description Verifies that the NestJS DI container compiles ChatModule and successfully resolves controllers and service providers.
   */
  it('should compile ChatModule and resolve controllers and providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, ChatModule],
    })
      .overrideProvider('EntryRepository')
      .useValue({
        save: jest.fn(),
        update: jest.fn(),
        findByDate: jest.fn(),
        listRecent: jest.fn(),
      })
      .overrideProvider('HabitMemoryStore')
      .useValue({
        get: jest.fn(),
        save: jest.fn(),
      })
      .overrideProvider('AIProvider')
      .useValue({
        processChatTurn: jest.fn(),
        extractContext: jest.fn(),
      })
      .overrideProvider('StorageProvider')
      .useValue({})
      .overrideProvider('GENAI_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();

    const controller = moduleRef.get<ChatController>(ChatController);
    const service = moduleRef.get<ChatService>(ChatService);

    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
