import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';

// Mock firebase admin since we don't have a real app initialized
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { EntriesController } from '../entries/presentation/controllers/entries.controller';
import { ChatController } from '../chat/presentation/controllers/chat.controller';

describe('AppModule', () => {
  it('should compile the module and resolve dependencies', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('GENAI_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();

    expect(module).toBeDefined();
    
    // Attempt to resolve controllers to ensure DI is wired properly
    const entriesController = module.get(EntriesController);
    const chatController = module.get(ChatController);
    
    expect(entriesController).toBeDefined();
    expect(chatController).toBeDefined();
  });
});
